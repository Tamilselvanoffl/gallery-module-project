import { useState, useEffect } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import imageCompression from "browser-image-compression";

const API = "http://localhost:5000";

function App() {

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [images, setImages] = useState([]);
  const [progress, setProgress] = useState(0);

  const fetchImages = async () => {
    const res = await axios.get(`${API}/images`);
    setImages(res.data);
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const onDrop = async (acceptedFiles) => {

    const imageFile = acceptedFiles[0];

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1200,
      useWebWorker: true
    };

    const compressedFile = await imageCompression(imageFile, options);

    setFile(compressedFile);
    setPreview(URL.createObjectURL(compressedFile));
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const uploadImage = async () => {

    if (!file) return alert("Select image");

    const formData = new FormData();
    formData.append("image", file);

    await axios.post(`${API}/upload`, formData, {

      onUploadProgress: (event) => {

        const percent = Math.round(
          (event.loaded * 100) / event.total
        );

        setProgress(percent);
      }
    });

    setFile(null);
    setPreview(null);
    setProgress(0);

    fetchImages();
  };

  const deleteImage = async (id) => {
    await axios.delete(`${API}/images/${id}`);
    fetchImages();
  };

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>

      <h1>📸 Gallery Upload</h1>

      {/* DROP ZONE */}

      <div
        {...getRootProps()}
        style={{
          border: "2px dashed #aaa",
          padding: "40px",
          textAlign: "center",
          cursor: "pointer",
          marginBottom: "20px",
          borderRadius: "10px"
        }}
      >
        <input {...getInputProps()} />
        <p>Drag & Drop image here or click</p>
      </div>

      {/* PREVIEW */}

      {preview && (
        <div style={{ marginBottom: "20px" }}>
          <h3>Preview</h3>
          <img src={preview} width="200" />

          <br />

          <button onClick={uploadImage}>
            Upload Image
          </button>

          {/* PROGRESS BAR */}

          {progress > 0 && (
            <div style={{ marginTop: "10px" }}>
              <div
                style={{
                  width: "300px",
                  height: "10px",
                  background: "#eee",
                  borderRadius: "5px"
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: "10px",
                    background: "green",
                    borderRadius: "5px"
                  }}
                />
              </div>
              <p>{progress}%</p>
            </div>
          )}

        </div>
      )}

      <hr />

      <h2>Gallery</h2>

      {/* GALLERY GRID */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))",
          gap: "20px"
        }}
      >
        {images.map((img) => (

          <div
            key={img._id}
            style={{
              border: "1px solid #ddd",
              padding: "10px",
              borderRadius: "10px"
            }}
          >

            <img
              src={`${API}/uploads/large/${img.filename}`}
              style={{ width: "100%" }}
            />

            <button
              onClick={() => deleteImage(img._id)}
              style={{
                marginTop: "10px",
                background: "red",
                color: "white",
                border: "none",
                padding: "6px",
                width: "100%"
              }}
            >
              Delete
            </button>

          </div>

        ))}
      </div>

    </div>
  );
}

export default App;