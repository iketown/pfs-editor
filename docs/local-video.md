# 📼 Local Video Strategy Guide for Web-Based Projects

> Goal: Enable users to work on **large local video files (15–20 GB)** inside a web-based editor **without uploading** them, and support **seamless project continuation** across browser sessions.

---

## ✅ Use Case Summary

- Users load a large local video file into the browser.
- The app tracks their project edits (e.g. timeline markers, funscript data, ROI zones).
- When users return to the project later, the app **tries to re-link the video file** so editing can continue without repeating the upload step.

---

## 📦 What Data Needs to Be Saved (Per Project)

To enable re-linking and project continuity:

| Key                         | Description                                                   |
|----------------------------|---------------------------------------------------------------|
| `fileName`                 | The name of the video file (e.g. `scene01.mp4`)              |
| `fileSize`                 | Size in bytes — helps match reselected files                 |
| `fileType`                 | MIME type (`video/mp4`, `video/webm`, etc.)                  |
| `duration` (optional)      | Useful for identification / metadata display                 |
| `lastModified` (optional)  | Helps detect if file changed since last session              |
| `videoHash` (optional)     | A content hash (e.g. SHA-1) to confirm identity              |
| `projectData`              | All user-created metadata (timeline, tracking, funscript, etc.) |
| `fileHandle` (Chromium only) | `FileSystemFileHandle` — allows persistent access       |

---

## 🧭 How to Access Local Video Files

### 🌐 Chromium Browsers (Chrome, Edge, Opera)

#### Initial File Load

```ts
const [handle] = await window.showOpenFilePicker({
  types: [{ description: 'Video Files', accept: { 'video/*': ['.mp4', '.webm', '.mov'] } }]
});

const file = await handle.getFile();
const url = URL.createObjectURL(file); // Use in <video>
