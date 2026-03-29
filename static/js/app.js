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
        loadHistory();
        return;
      }

      if (data.status === "failed") {
        errorDetail.textContent = data.error || "不明なエラーが発生しました";
        showPanel("failed");
        loadHistory();
        return;
      }
    }
  }

  // 履歴
  const historyList = document.getElementById("history-list");

  async function loadHistory() {
    try {
      const resp = await fetch("/api/jobs");
      if (!resp.ok) return;
      const jobs = await resp.json();
      renderHistory(jobs);
    } catch {
      // ignore
    }
  }

  function renderHistory(jobs) {
    if (jobs.length === 0) {
      historyList.innerHTML = '<p class="text-sm text-gray-400">変換履歴はありません</p>';
      return;
    }

    historyList.innerHTML = jobs.map(job => {
      const name = job.original_filename || "不明";
      const date = job.created_at
        ? new Date(job.created_at).toLocaleString("ja-JP")
        : "";
      const badge = job.status === "completed"
        ? '<span class="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">完了</span>'
        : job.status === "failed"
        ? '<span class="text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">失敗</span>'
        : '<span class="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">変換中</span>';
      const dl = job.status === "completed"
        ? `<a href="/api/jobs/${job.id}/download" class="text-xs text-blue-600 hover:underline ml-2">DL</a>`
        : "";
      return `
        <div class="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
          <div class="min-w-0 mr-3">
            <p class="text-sm font-medium text-gray-800 truncate">${escapeHtml(name)}</p>
            <p class="text-xs text-gray-400">${date}</p>
          </div>
          <div class="flex items-center shrink-0">${badge}${dl}</div>
        </div>`;
    }).join("");
  }

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
  }

  loadHistory();

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
