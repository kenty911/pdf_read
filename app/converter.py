import gc
import logging
import os
import threading
from io import BytesIO
from pathlib import Path

logger = logging.getLogger(__name__)

_synthesizer = None
_synthesizer_lock = threading.Lock()


def _get_synthesizer():
    global _synthesizer
    if _synthesizer is not None:
        return _synthesizer
    with _synthesizer_lock:
        if _synthesizer is not None:
            return _synthesizer
        _synthesizer = _init_synthesizer()
    return _synthesizer


def _init_synthesizer():
    from voicevox_core.blocking import Onnxruntime, OpenJtalk, Synthesizer, VoiceModelFile

    onnx_path = os.environ["VOICEVOX_ONNXRUNTIME_PATH"]
    dict_dir = os.environ["VOICEVOX_DICT_DIR"]
    vvm_path = os.environ["VOICEVOX_VVM_PATH"]

    logger.info(f"VoiceVox初期化中: onnx={onnx_path}")
    onnxruntime = Onnxruntime.load_once(filename=onnx_path)
    synthesizer = Synthesizer(
        onnxruntime,
        OpenJtalk(dict_dir),
    )
    with VoiceModelFile.open(vvm_path) as model:
        synthesizer.load_voice_model(model)

    logger.info("VoiceVox初期化完了")
    return synthesizer


def _text_to_mp3(synthesizer, text: str, style_id: int = 0) -> bytes:
    from pydub import AudioSegment

    lines = [line.strip() for line in text.split("\n") if line.strip()]
    if not lines:
        return b""

    logger.info(f"音声合成開始: {len(lines)}行")
    combined: AudioSegment | None = None

    for i, line in enumerate(lines):
        if i % 50 == 0:
            logger.info(f"  進捗: {i}/{len(lines)}")

        audio_query = synthesizer.create_audio_query(line, style_id)
        wav_data = synthesizer.synthesis(audio_query, style_id)
        segment = AudioSegment.from_wav(BytesIO(wav_data))

        combined = segment if combined is None else combined + segment

        del wav_data, segment, audio_query
        gc.collect()

    if combined is None:
        return b""

    buf = BytesIO()
    combined.export(buf, format="mp3", bitrate="128k")
    result = buf.getvalue()
    del combined
    gc.collect()
    return result


def _run_conversion(app, job_id: str) -> None:
    with app.app_context():
        from . import db
        from .models import Job
        from .pdf_processor import clean_text_for_speech, extract_text_from_pdf
        from .storage import get_output_path

        job = db.session.get(Job, job_id)
        if job is None:
            return

        try:
            text = extract_text_from_pdf(job.pdf_path)
            cleaned = clean_text_for_speech(text)

            if not cleaned.strip():
                raise ValueError("テキストが抽出できませんでした")

            synthesizer = _get_synthesizer()
            mp3_data = _text_to_mp3(synthesizer, cleaned)

            if not mp3_data:
                raise ValueError("音声データの生成に失敗しました")

            output_path = get_output_path(job_id)
            Path(output_path).write_bytes(mp3_data)

            job.status = "completed"
            job.mp3_path = str(output_path)
            logger.info(f"変換完了: job_id={job_id} size={len(mp3_data) / 1024:.1f}KB")

        except Exception as e:
            logger.exception(f"変換エラー: job_id={job_id}")
            job.status = "failed"
            job.error_message = str(e)

        db.session.commit()


def start_conversion(app, job_id: str) -> None:
    thread = threading.Thread(target=_run_conversion, args=(app, job_id), daemon=True)
    thread.start()
