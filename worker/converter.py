import gc
import logging
import os
import shutil
from io import BytesIO
from pathlib import Path

logger = logging.getLogger(__name__)

_synthesizer = None
_BATCH_SIZE = 50


def _get_synthesizer():
    global _synthesizer
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
    synthesizer = Synthesizer(onnxruntime, OpenJtalk(dict_dir))
    with VoiceModelFile.open(vvm_path) as model:
        synthesizer.load_voice_model(model)
    logger.info("VoiceVox初期化完了")
    return synthesizer


def _synthesize_batch(synthesizer, batch_lines: list[str], batch_path: Path, style_id: int = 0) -> None:
    if batch_path.exists():
        logger.info(f"  バッチスキップ（既存）: {batch_path.name}")
        return

    from pydub import AudioSegment

    combined = None
    for line in batch_lines:
        audio_query = synthesizer.create_audio_query(line, style_id)
        wav_data = synthesizer.synthesis(audio_query, style_id)
        segment = AudioSegment.from_wav(BytesIO(wav_data))
        combined = segment if combined is None else combined + segment
        del wav_data, segment, audio_query
        gc.collect()

    if combined is not None:
        combined.export(str(batch_path), format="wav")
        del combined
        gc.collect()


def _combine_batches_to_mp3(batch_dir: Path, num_batches: int) -> bytes:
    from pydub import AudioSegment

    combined = None
    for batch_idx in range(num_batches):
        batch_path = batch_dir / f"batch_{batch_idx:04d}.wav"
        segment = AudioSegment.from_wav(str(batch_path))
        combined = segment if combined is None else combined + segment
        del segment
        gc.collect()

    if combined is None:
        return b""

    buf = BytesIO()
    combined.export(buf, format="mp3", bitrate="128k")
    result = buf.getvalue()
    del combined
    gc.collect()
    return result


def run_conversion(job_id: str, job_db) -> None:
    """K8s Job エントリポイントから呼ばれるメイン変換関数"""
    from pdf_processor import clean_text_for_speech, extract_text_from_pdf

    data_dir = Path(os.environ.get("DATA_DIR", "/data"))
    batch_dir = data_dir / "outputs" / job_id / "batches"
    batch_dir.mkdir(parents=True, exist_ok=True)
    output_path = data_dir / "outputs" / job_id / "output.mp3"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    pdf_path = job_db.get_pdf_path()
    if not pdf_path:
        raise ValueError(f"pdf_path が設定されていません: job_id={job_id}")

    text = extract_text_from_pdf(pdf_path)
    cleaned = clean_text_for_speech(text)

    if not cleaned.strip():
        raise ValueError("テキストが抽出できませんでした")

    lines = [line.strip() for line in cleaned.split("\n") if line.strip()]
    batches = [lines[i : i + _BATCH_SIZE] for i in range(0, len(lines), _BATCH_SIZE)]
    logger.info(f"音声合成開始: {len(lines)}行 / {len(batches)}バッチ")

    job_db.update_progress(0, len(lines))
    synthesizer = _get_synthesizer()

    for batch_idx, batch_lines in enumerate(batches):
        logger.info(f"  バッチ {batch_idx + 1}/{len(batches)}")
        batch_path = batch_dir / f"batch_{batch_idx:04d}.wav"
        _synthesize_batch(synthesizer, batch_lines, batch_path)
        job_db.update_progress(min((batch_idx + 1) * _BATCH_SIZE, len(lines)))

    logger.info("バッチ結合・mp3変換中")
    mp3_data = _combine_batches_to_mp3(batch_dir, len(batches))

    if not mp3_data:
        raise ValueError("音声データの生成に失敗しました")

    output_path.write_bytes(mp3_data)
    shutil.rmtree(str(batch_dir), ignore_errors=True)
    logger.info(f"変換完了: job_id={job_id} size={len(mp3_data) / 1024:.1f}KB")
    return str(output_path)
