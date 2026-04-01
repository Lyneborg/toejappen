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

  useEffect(() => {
    // Check session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
  if (!user) return <Login />;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <header style={{ backgroundColor: '#333', color: 'white', padding: '20px', textAlign: 'center' }}>
        <h1>👕 Tøjkatalog → Vinted-opslag</h1>
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
