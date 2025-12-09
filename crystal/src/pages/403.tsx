const Forbidden = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '2rem',
      fontWeight: 'bold',
    }}>
      Your session has expired
    </div>
  );
};

export default Forbidden;
