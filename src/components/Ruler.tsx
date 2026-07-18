
export default function Ruler() {
  return <div>
    {[...Array(101).keys()]
      .slice(1)
      .map((x) => `.........${x % 10}`)
      .join("")}
    <br />
    {"1234567890".repeat(100)}
  </div>;
}
