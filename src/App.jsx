import { useState, useEffect } from 'react';
import UploadStep from './components/UploadStep';
import FormStep from './components/FormStep';
import PreviewStep from './components/PreviewStep';
import Login from './components/Login';
import { supabase } from './lib/supabaseClient';

export default function App() {
  const [step, setStep] = useState('upload');
  const [image, setImage] = useState(null);
  const [formData, setFormData] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: session, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        setUser(session?.user || null);
      } catch (err) {
        console.error('Auth check failed:', err);
        setError(err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;

  if (!user) {
    return <Login />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <header style={{ backgroundColor: '#333', color: 'white', padding: '20px', textAlign: 'center' }}>
        <h1>Clothing Catalog - Vinted Listings</h1>
      </header>

      <main>
        {step === 'upload' && (
          <UploadStep
            onImageSelected={(img) => {
              setImage(img);
              setStep('form');
            }}
          />
        )}

        {step === 'form' && image && (
          <FormStep
            imageUrl={image.url}
            onSubmit={(data) => {
              setFormData(data);
              setStep('preview');
            }}
          />
        )}

        {step === 'preview' && image && formData && (
          <PreviewStep
            formData={formData}
            filePath={image.filePath}
            onSave={() => {
              setStep('upload');
              setImage(null);
              setFormData(null);
            }}
          />
        )}
      </main>
    </div>
  );
}