import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api';
const FILE_URL = API_URL.replace('/api', '');

const Vault: React.FC = () => {
    const navigate = useNavigate();
    const [docs, setDocs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<'id' | 'insurance' | 'medical' | 'other'>('other');
    const [isUploading, setIsUploading] = useState(false);

    const fetchDocs = async () => {
         setIsLoading(true);
         try {
             const res = await axios.get(`${API_URL}/vault`);
             setDocs(res.data);
         } catch (err) {
             console.error("Fetch failed:", err);
         } finally {
             setIsLoading(false);
         }
    };

    useEffect(() => {
         fetchDocs();
    }, []);

    const handleUpload = async (e: React.FormEvent) => {
         e.preventDefault();
         if (!file) return;

         setIsUploading(true);
         const formData = new FormData();
         formData.append('file', file);
         formData.append('title', title || file.name);
         formData.append('category', category);

         try {
             await axios.post(`${API_URL}/vault/upload`, formData, {
                  headers: { 'Content-Type': 'multipart/form-data' }
             });
             alert('Document uploaded successfully!');
             setFile(null);
             setTitle('');
             fetchDocs();
         } catch (err) {
              console.error("Upload failed:", err);
              alert('Upload failed');
         } finally {
              setIsUploading(false);
         }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this document?")) return;
        try {
            await axios.delete(`${API_URL}/vault/${id}`);
            fetchDocs();
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '2rem auto' }}>
            <button className="btn" style={{ marginBottom: '1rem', backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'white' }} onClick={() => navigate('/')}>
                ← Back to Dashboard
            </button>
            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h2 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>🔒 The Vault</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Securely store and access your critical emergency documents.</p>

                {/* Upload Form */}
                <form onSubmit={handleUpload} style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ margin: 0 }}>Upload New Document</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <input type="text" className="input-field" placeholder="Title (Optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
                        <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value as any)}>
                            <option value="other">Category: Other</option>
                            <option value="id">ID Documents</option>
                            <option value="insurance">Insurance</option>
                            <option value="medical">Medical</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <input type="file" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} style={{ flex: 1, backgroundColor: 'var(--surface-color)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }} required />
                        <button type="submit" className="btn btn-primary" disabled={isUploading}>
                            {isUploading ? 'Uploading...' : 'Upload'}
                        </button>
                    </div>
                </form>

                {/* Docs List */}
                {isLoading ? (
                    <p style={{ textAlign: 'center' }}>Loading documents...</p>
                ) : docs.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No documents saved yet.</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                        {docs.map(doc => (
                            <div key={doc._id} style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                    <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>{doc.category.toUpperCase()}</span>
                                    <h4 style={{ marginTop: '0.5rem', marginBottom: '0.2rem', wordBreak: 'break-all' }}>{doc.title}</h4>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(doc.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', alignItems: 'center' }}>
                                    <a href={`${FILE_URL}${doc.fileUrl}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 'bold' }}>
                                        View File ↗
                                    </a>
                                    <button onClick={() => handleDelete(doc._id)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', fontSize: '1rem' }}>
                                        🗑
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Vault;
