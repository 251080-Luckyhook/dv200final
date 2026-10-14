const BLOBS = [
  { left: '2%', top: '4%', size: 110, color: '#f2efe6', radius: '60% 40% 55% 45%' },
  { left: '22%', top: '10%', size: 90, color: '#f8cfc6', radius: '50% 50% 40% 60%' },
  { left: '44%', top: '4%', size: 70, color: '#d8eadc', radius: '50%' },
  { left: '66%', top: '2%', size: 150, color: '#f9d4b6', radius: '60% 40% 30% 70%' },
  { left: '90%', top: '4%', size: 80, color: '#d8eadc', radius: '50%' },
  { left: '4%', top: '34%', size: 100, color: '#d9dcf2', radius: '50% 50% 50% 50% / 60% 60% 40% 40%' },
  { left: '82%', top: '24%', size: 80, color: '#d9dcf2', radius: '60% 40% 60% 40%' },
  { left: '10%', top: '60%', size: 130, color: '#d8eadc', radius: '60% 40% 50% 50%' },
  { left: '66%', top: '40%', size: 130, color: '#c9e6f0', radius: '40% 60% 30% 70%' },
  { left: '78%', top: '66%', size: 100, color: '#f8cfc6', radius: '20% 80% 30% 70%' },
  { left: '50%', top: '84%', size: 110, color: '#d9dcf2', radius: '50% 50% 30% 30%' },
  { left: '28%', top: '82%', size: 80, color: '#fbe9b8', radius: '50% 50% 50% 50% / 70% 70% 30% 30%' },
  { left: '88%', top: '84%', size: 110, color: '#fbe9b8', radius: '50%' },
];

export default function BlobBackground() {
  return (
    <div className="blobs" aria-hidden="true">
      {BLOBS.map((blob, index) => (
        <span
          key={index}
          style={{
            left: blob.left,
            top: blob.top,
            width: blob.size,
            height: blob.size,
            background: blob.color,
            borderRadius: blob.radius,
          }}
        />
      ))}
    </div>
  );
}
