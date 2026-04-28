# Fine-Tuning Guide: AP Health IQ Model

## Step 1 — Generate Training Data (local machine)
```bash
cd backend
pip install pandas openpyxl
python -m ai.prepare_training_data
# Output: backend/ai/training_data.jsonl (~25,000 pairs)
```

## Step 2 — Open Google Colab (free T4 GPU)
Go to https://colab.research.google.com and create a new notebook.

Upload `training_data.jsonl` to the Colab session.

## Step 3 — Run in Colab (copy-paste each cell)

### Cell 1: Install Unsloth
```python
%%capture
import torch
!pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
!pip install --no-deps "xformers<0.0.27" "trl<0.9.0" peft accelerate bitsandbytes
```

### Cell 2: Load base model
```python
from unsloth import FastLanguageModel
import torch

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/Llama-3.2-3B-Instruct",
    max_seq_length=2048,
    dtype=None,
    load_in_4bit=True,
)
model = FastLanguageModel.get_peft_model(
    model,
    r=16,
    target_modules=["q_proj","k_proj","v_proj","o_proj","gate_proj","up_proj","down_proj"],
    lora_alpha=16,
    lora_dropout=0,
    bias="none",
    use_gradient_checkpointing="unsloth",
    random_state=42,
)
```

### Cell 3: Load training data
```python
from datasets import load_dataset
dataset = load_dataset("json", data_files="/content/training_data.jsonl", split="train")

alpaca_prompt = """Below is an instruction from an AP Health Medical Officer. Write a clinical response.

### Instruction:
{}

### Input:
{}

### Response:
{}"""

EOS_TOKEN = tokenizer.eos_token

def format_prompts(examples):
    instructions = examples["instruction"]
    inputs = examples["input"]
    outputs = examples["output"]
    texts = []
    for instruction, inp, output in zip(instructions, inputs, outputs):
        text = alpaca_prompt.format(instruction, inp, output) + EOS_TOKEN
        texts.append(text)
    return {"text": texts}

dataset = dataset.map(format_prompts, batched=True)
```

### Cell 4: Train (1-2 hours on T4)
```python
from trl import SFTTrainer
from transformers import TrainingArguments

trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=dataset,
    dataset_text_field="text",
    max_seq_length=2048,
    dataset_num_proc=2,
    args=TrainingArguments(
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        warmup_steps=5,
        num_train_epochs=3,
        learning_rate=2e-4,
        fp16=not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_bf16_supported(),
        logging_steps=10,
        optim="adamw_8bit",
        weight_decay=0.01,
        lr_scheduler_type="linear",
        output_dir="outputs",
        seed=42,
    ),
)
trainer.train()
```

### Cell 5: Save as GGUF for Ollama
```python
model.save_pretrained_gguf(
    "ap-health",
    tokenizer,
    quantization_method="q4_k_m",
)
# Downloads ap-health-unsloth.Q4_K_M.gguf (~2GB)
```

## Step 4 — Load into Ollama on RunPod

1. Start a RunPod instance with Ollama pre-installed (RTX 3080, ~$0.34/hr)
2. Upload `ap-health-unsloth.Q4_K_M.gguf` to the RunPod instance
3. Copy `backend/ai/Modelfile` to the same folder
4. Run:
```bash
# On RunPod terminal
cp ap-health-unsloth.Q4_K_M.gguf ap-health-q4.gguf
ollama create ap-health -f Modelfile
ollama run ap-health "Which AP district has the highest fever burden?"
```

5. Set in Railway backend env:
```
OLLAMA_BASE_URL=http://<runpod-public-ip>:11434
OLLAMA_MODEL=ap-health:latest
```

## Step 5 — Test
```bash
curl -X POST http://<runpod-ip>:11434/api/chat \
  -d '{"model":"ap-health:latest","messages":[{"role":"user","content":"Which AP district has the highest fever burden?"}],"stream":false}'
```

Expected response references East Godavari, real AP case counts, and actionable clinical guidance.
