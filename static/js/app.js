(() => {
  const POLL_INTERVAL_MS = 3000;

  const panels = {
    upload:     document.getElementById("panel-upload"),
    processing: document.getElementById("panel-processing"),
    completed:  document.getElementById("panel-completed"),
    failed:     document.getElementById("panel-failed"),
  };

  const fileInput   = document.getElementById("file-input");
  const dropZone    = document.getElementById("drop-zone");
  const fileName    = document.getElementById("file-name");
  const convertBtn  = document.getElementById("convert-btn");
  const uploadError = document.getElementById("upload-error");
  const downloadLink = document.getElementById("download-link");
  const errorDetail  = document.getElementById("error-detail");

  let selectedFile = null;

  function showPanel(name) {
    Object.values(panels).forEach(p => p.classList.add("hidden"));
    panels[name].classList.remove("hidden");
  }

  function setFile(file) {
    if (!file || !file.name.toLowerCase().endsWith(".pdf")) {
      showUploadError("PDFファイルを選択してください");
      return;
    }
    selectedFile = file;
    fileName.textContent = file.name;
    convertBtn.disabled = false;
    hideUploadError();
  }

  function showUploadError(msg) {
    uploadError.textContent = msg;
    uploadError.classList.remove("hidden");
  }

  function hideUploadError() {
    uploadError.classList.add("hidden");
  }

  // ファイル選択
  fileInput.addEventListener("change", () => {
    if (fileInput.files[0]) setFile(fileInput.files[0]);
  });

  // ドラッグ&ドロップ
  dropZone.addEventListener("dragover", e => {
    e.preventDefault();
    dropZone.classList.add("border-blue-400", "bg-blue-50");
  });
  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("border-blue-400", "bg-blue-50");
  });
  dropZone.addEventListener("drop", e => {
    e.preventDefault();
    dropZone.classList.remove("border-blue-400", "bg-blue-50");
    if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
  });

  // 変換ボタン
  convertBtn.addEventListener("click", async () => {
    if (!selectedFile) return;

    convertBtn.disabled = true;
    hideUploadError();

    const formData = new FormData();
    formData.append("file", selectedFile);

    let jobId;
    try {
      const resp = await fetch("/api/jobs", { method: "POST", body: formData });
      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || "アップロードに失敗しました");
      }
      jobId = data.job_id;
    } catch (err) {
      showUploadError(err.message);
      convertBtn.disabled = false;
      return;
    }

    showPanel("processing");
    pollStatus(jobId);
  });

  async function pollStatus(jobId) {
    while (true) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));

      let data;
      try {
        const resp = await fetch(`/api/jobs/${jobId}/status`);
        data = await resp.json();
      } catch {
        continue;
      }

      if (data.status === "completed") {
        downloadLink.href = `/api/jobs/${jobId}/download`;
        showPanel("completed");
        return;
      }

      if (data.status === "failed") {
        errorDetail.textContent = data.error || "不明なエラーが発生しました";
        showPanel("failed");
        return;
      }
    }
  }

  // リセット
  function resetToUpload() {
    selectedFile = null;
    fileInput.value = "";
    fileName.textContent = "";
    convertBtn.disabled = true;
    hideUploadError();
    showPanel("upload");
  }

  document.getElementById("reset-btn").addEventListener("click", resetToUpload);
  document.getElementById("retry-btn").addEventListener("click", resetToUpload);
})();
