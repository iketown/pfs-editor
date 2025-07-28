# 📌 Local Video Strategy Guide for Web-Based Projects

> Goal: Enable users to work on **large local video files (15–20 GB)** inside a web-based editor **without uploading** them, and support **seamless project continuation** across browser sessions.

---

## ✅ Use Case Summary

- Users load a large local video file into the browser.
- The app tracks their project edits (e.g. timeline markers, funscript data, ROI zones).
- When users return to the project later, the app **tries to re-link the video file** so editing can continue without repeating the upload step.

---

## 📦 What Data Needs to Be Saved (Per Project)

To enable re-linking and project continuity:

| Key                          | Description                                                     |
| ---------------------------- | --------------------------------------------------------------- |
| `fileName`                   | The name of the video file (e.g. `scene01.mp4`)                 |
| `fileSize`                   | Size in bytes — helps match reselected files                    |
| `fileType`                   | MIME type (`video/mp4`, `video/webm`, etc.)                     |
| `duration` (optional)        | Useful for identification / metadata display                    |
| `lastModified` (optional)    | Helps detect if file changed since last session                 |
| `videoHash` (optional)       | A content hash (e.g. SHA-1) to confirm identity                 |
| `projectData`                | All user-created metadata (timeline, tracking, funscript, etc.) |
| `fileHandle` (Chromium only) | `FileSystemFileHandle` — allows persistent access               |

---

## 🗌 How to Access Local Video Files

### 🌐 Chromium Browsers (Chrome, Edge, Opera)

#### Initial File Load

```ts
const [handle] = await window.showOpenFilePicker({
  types: [{ description: 'Video Files', accept: { 'video/*': ['.mp4', '.webm', '.mov'] } }]
});

const file = await handle.getFile();
const url = URL.createObjectURL(file); // Use in <video>
```

#### Save for Reuse

- Store the `handle` in **IndexedDB** or app state.
- Store metadata (`fileName`, `size`, etc.) with project data.
- Optionally compute a `videoHash` (e.g., SHA-1 of first few MB).

#### On Project Reload

```ts
const file = await handle.getFile();
const url = URL.createObjectURL(file);
```

> ✅ No re-prompt needed once permission is granted.

---

### 🦊 Non-Chromium Browsers (Safari, Firefox)

These browsers **do not support persistent file handles**. You'll need to:

#### Initial File Load

```html
<input type="file" accept="video/*" />
```

```ts
input.onchange = (e) => {
  const file = e.target.files[0];
  const url = URL.createObjectURL(file);
  // Save file metadata to help re-link later
};
```

#### On Project Reload

- Prompt user: "Please re-select video file: `scene01.mp4`"
- Use metadata (file name, size, hash) to confirm it's the same file.

---

## 🧠 Optional: Video Identity Verification

To help detect accidental mismatches:

- Hash the first 5–10MB of the file using `crypto.subtle.digest()`.
- Store and compare that hash when re-linking the file.

```ts
async function hashFile(file) {
  const chunk = await file.slice(0, 10_000_000).arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-1', chunk);
  return [...new Uint8Array(hashBuffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}
```

---

## 🛠️ IndexedDB Storage Helper (Chromium Only)

```ts
// Save handle
await db.videoHandles.put({ projectId, handle });

// Load handle
const entry = await db.videoHandles.get(projectId);
const file = await entry.handle.getFile();
```

Use libraries like [idb](https://github.com/jakearchibald/idb) for ergonomic IndexedDB access.

---

## 🪄 UX Recommendations

| Platform       | Behavior                                                        |
| -------------- | --------------------------------------------------------------- |
| Chromium       | Auto-reload video using saved handle, no prompt needed          |
| Firefox/Safari | Show “Re-select your video file: scene01.mp4” prompt            |
| All            | Display stored metadata (filename, size, etc.) for confirmation |
| Optional       | Use hash check to validate re-linked file                       |

---

## 🔐 Security & Permissions

- Chromium may revoke access if origin changes (e.g. localhost → deployed domain).
- Users can clear permissions in browser settings, breaking persistent access.
- Safari/Firefox will always require manual file input per session.

---

## 🔮 To Test

- Save and reload projects across sessions.
- Test on: Chrome, Firefox, Safari, Edge.
- Confirm correct fallback behavior and re-linking flows.

---

## 🧼 Cleanup

- Use `URL.revokeObjectURL(url)` when you're done with the video blob to avoid memory leaks.

---

## 🧹 Related APIs

- `FileSystemAccessAPI` (Chromium only): [MDN](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)
- `URL.createObjectURL()`: Generate blob URL for `<video>`
- `crypto.subtle.digest()`: Hashing files in browser

---

