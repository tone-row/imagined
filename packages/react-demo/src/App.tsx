import { LivingImage } from "living-image";
import "./App.css";

function App() {
  return (
    <>
      <div style={{ width: "400px", margin: "0 auto" }}>
        <h2>AI Generated Image</h2>
        <LivingImage
          prompt="a turtle"
          width={1024}
          height={1024}
          className="demo-image"
          style={{
            width: "100%",
            height: "auto",
          }}
        />
      </div>
    </>
  );
}

export default App;
