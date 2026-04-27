import { useEffect, useState } from "react";

function Cursor() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible((prev) => !prev);
    }, 670);

    return () => clearInterval(interval);
  }, []);

  //timeout .8 s
  if (isVisible) {
    return (
      <span style={{ color: "#41ff00", fontWeight: "bold", fontSize: "1em" }}>
        {isVisible ? "█" : ""}
      </span>
    );
  }
}

export default Cursor;
