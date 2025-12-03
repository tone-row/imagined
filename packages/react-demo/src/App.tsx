import { LivingImage } from "living-image";
import "./App.css";

function App() {
  return (
    <>
      <div className="card">
        <h2>AI Generated Image</h2>
        <LivingImage
          prompt="a majestic mountain landscape at sunrise with golden light"
          width={1024}
          height={1024}
          className="demo-image"
          style={{
            border: "2px solid #646cff",
            borderRadius: "8px",
            maxWidth: "100%",
            height: "auto",
          }}
        />
        <p style={{ marginTop: "10px", fontSize: "14px", color: "#888" }}>
          This image will be generated when you run the macro!
        </p>
      </div>
    </>
  );
}

export default App;
