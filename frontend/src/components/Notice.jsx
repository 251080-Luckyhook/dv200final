// Show a short success or error message beside the form.
export default function Notice({ error, message }) {
  if (!error && !message) {
    return null;
  }

  return (
    <p className={`notice ${error ? 'error' : 'success'}`} role={error ? 'alert' : 'status'}>
      {error || message}
    </p>
  );
}
