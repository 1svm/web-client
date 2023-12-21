import { ChangeEvent } from "react";

function App() {
  const handleFileChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const selected_files = Array.from(ev.target.files ?? []);
    console.log(selected_files);
  };

  return (
    <>
      <input
        type="file"
        name="file"
        accept="image/*"
        onChange={handleFileChange}
        multiple
      />
    </>
  );
}

export default App;

/*
  <button onclick="startUpload()">Start Upload</button>
  <button onclick="pauseUpload()">Pause Upload</button>
  <button onclick="resumeUpload()">Resume Upload</button>
  <div id="progress"></div>

  <script>
    document.addEventListener("DOMContentLoaded", function() {
      var fileInput = document.getElementById('fileInput');
      var progressDiv = document.getElementById('progress');

      var files = [];
      var chunkSize = 1 * 1024 * 1024; // 1MB chunks
      var isPaused = false;
      var controllers = [];

      fileInput.addEventListener('change', function(event) {
        files = Array.from(event.target.files);
      });

      window.startUpload = function() {
        if (files.length === 0) {
          alert('Please select one or more files.');
          return;
        }

        isPaused = false;
        controllers = files.map(() => new AbortController());
        files.forEach((file, index) => uploadChunk(file, index));
      };

      window.pauseUpload = function() {
        isPaused = true;
        controllers.forEach(controller => controller.abort());
      };

      window.resumeUpload = function() {
        isPaused = false;
        controllers = files.map(() => new AbortController());
        files.forEach((file, index) => uploadChunk(file, index));
      };

      function uploadChunk(file, index) {
        if (isPaused) {
          return;
        }

        var currentChunk = file.uploadedChunks || 0;
        var start = currentChunk * chunkSize;
        var end = Math.min(start + chunkSize, file.size);
        var chunk = file.slice(start, end);

        var formData = new FormData();
        formData.append('file', chunk);

        var headers = new Headers();
        headers.append('Content-Range', 'bytes ' + start + '-' + (end - 1) + '/' + file.size);

        var controller = controllers[index];
        var signal = controller.signal;

        fetch('/upload', {
          method: 'POST',
          headers: headers,
          body: formData,
          signal: signal,
        })
        .then(response => {
          if (response.ok) {
            file.uploadedChunks = currentChunk + 1;

            var progress = Math.floor((file.uploadedChunks * chunkSize) / file.size * 100);
            progressDiv.innerText = 'Progress: ' + progress + '%';

            if (end < file.size) {
              uploadChunk(file, index);
            } else if (files.every(f => f.uploadedChunks === f.totalChunks)) {
              progressDiv.innerText = 'All uploads complete!';
            }
          } else {
            console.error('Error uploading file:', response.statusText);
          }
        })
        .catch(error => {
          if (error.name !== 'AbortError') {
            console.error('Network error during file upload:', error.message);
          }
        });
      }
    });
  </script>
</body>
</html>

*/
