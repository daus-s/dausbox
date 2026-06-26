import { useEffect, useState } from "react";

export default function Cursor({ char }: { char: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setVisible((v) => !v), 670);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      style={{
        color: "#41ff00",
        fontWeight: "bold",
      }}
    >
      {visible ? "█" : char}
    </span>
  );
}
