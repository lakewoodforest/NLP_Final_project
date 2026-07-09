"""KLUE-RoBERTa 조항 분류기 학습 — 원본 NLP_final_real_estate/contract_classifier/train.py
를 병합본 경로에 맞춰 포팅.

실행:
    cd backend
    pip install -r requirements-full.txt      # torch, transformers, datasets, scikit-learn
    python3 train_classifier.py

결과:
    backend/model/clause_classifier/ 에 파인튜닝 가중치 저장.
    → 서버를 재시작하면 clause_classifier 가 자동으로 knn-fallback → klue-roberta 로 승격됩니다.

데이터: backend/data/clauses.csv (정상 272 / 주의 247 / 위험 243, 762건)
Apple Silicon(iMac)은 MPS 가속으로 CPU보다 훨씬 빠릅니다 (수 분 내 완료).
"""
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from datasets import Dataset
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    Trainer,
    TrainingArguments,
)

BASE = Path(__file__).resolve().parent          # backend/
DATA_CSV = BASE / "data" / "clauses.csv"
SAVE_PATH = BASE / "model" / "clause_classifier"
LOG_DIR = BASE / "model" / "logs"

LABELS = {0: "정상", 1: "주의", 2: "위험"}
MODEL_NAME = "klue/roberta-base"


def tokenize(batch, tokenizer):
    return tokenizer(batch["clause"], padding="max_length", truncation=True, max_length=128)


def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    report = classification_report(
        labels, preds, target_names=list(LABELS.values()), output_dict=True
    )
    return {"accuracy": report["accuracy"], "f1_macro": report["macro avg"]["f1-score"]}


def main():
    df = pd.read_csv(DATA_CSV).dropna(subset=["clause", "label"])
    df["label"] = df["label"].astype(int)
    train_df, val_df = train_test_split(
        df, test_size=0.2, random_state=42, stratify=df["label"]
    )

    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME, num_labels=3)

    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    print(f"[train] device: {device}")
    model = model.to(device)

    train_ds = Dataset.from_pandas(train_df.reset_index(drop=True)).map(
        lambda x: tokenize(x, tokenizer), batched=True
    )
    val_ds = Dataset.from_pandas(val_df.reset_index(drop=True)).map(
        lambda x: tokenize(x, tokenizer), batched=True
    )
    for ds in (train_ds, val_ds):
        ds.set_format("torch", columns=["input_ids", "attention_mask", "label"])

    # transformers 버전에 따라 eval_strategy / evaluation_strategy 인자명이 다름 → 양쪽 대응
    common = dict(
        output_dir=str(SAVE_PATH),
        num_train_epochs=5,
        per_device_train_batch_size=16,
        per_device_eval_batch_size=16,
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="f1_macro",
        logging_dir=str(LOG_DIR),
        logging_steps=10,
    )
    try:
        args = TrainingArguments(eval_strategy="epoch", **common)
    except TypeError:
        args = TrainingArguments(evaluation_strategy="epoch", **common)

    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=train_ds,
        eval_dataset=val_ds,
        compute_metrics=compute_metrics,
    )
    trainer.train()

    SAVE_PATH.mkdir(parents=True, exist_ok=True)
    trainer.save_model(str(SAVE_PATH))
    tokenizer.save_pretrained(str(SAVE_PATH))
    print(f"[train] 저장 완료 → {SAVE_PATH}")
    print("[train] 서버를 재시작하면 분류기가 KLUE-RoBERTa 로 자동 승격됩니다.")


if __name__ == "__main__":
    main()
