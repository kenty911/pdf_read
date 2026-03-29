VOICEVOX_SRC ?= /home/kento/pdf_to_wav/example/python

.PHONY: setup-voicevox build dev

# ローカルビルド用: 既存のバイナリからvoicevox/ディレクトリを作成
# (CI では Dockerfile の Stage 1 で自動ダウンロードするため不要)
setup-voicevox:
	mkdir -p voicevox
	cp -r $(VOICEVOX_SRC)/onnxruntime voicevox/
	cp -r $(VOICEVOX_SRC)/models      voicevox/
	cp -r $(VOICEVOX_SRC)/dict        voicevox/
	@echo "voicevox/ の準備完了"

build:
	docker build -t pdf-to-mp3:latest .

dev:
	docker compose up --build
