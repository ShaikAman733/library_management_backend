import { useEffect, useState } from 'react';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const initialCategory = {
  name: '',
};

export default function Settings() {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [categoryForm, setCategoryForm] = useState(initialCategory);
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  const loadCategories = () => {
    setError('');
    axios
      .get(`${BASE_URL}/categories/`)
      .then((resp) => setCategories(resp.data.results || resp.data))
      .catch(() => setError('Unable to load categories'));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openNewCategory = () => {
    setCategoryForm(initialCategory);
    setEditingCategoryId(null);
    setFormVisible(true);
    setError('');
  };

  const openEditCategory = (category) => {
    setCategoryForm({ name: category.name || '' });
    setEditingCategoryId(category.id);
    setFormVisible(true);
    setError('');
  };

  const handleCategoryChange = (value) => {
    setCategoryForm({ name: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const payload = { name: categoryForm.name };
      if (editingCategoryId) {
        await axios.put(`${BASE_URL}/categories/${editingCategoryId}/`, payload);
      } else {
        await axios.post(`${BASE_URL}/categories/`, payload);
      }
      setFormVisible(false);
      loadCategories();
    } catch (err) {
      const response = err.response;
      if (response) {
        if (response.status === 403) {
          setError('You must be a librarian to manage categories.');
          return;
        }
        if (response.data) {
          if (response.data.detail) {
            setError(response.data.detail);
            return;
          }
          if (response.data.name) {
            setError(Array.isArray(response.data.name) ? response.data.name.join(' ') : response.data.name);
            return;
          }
        }
      }
      setError('Unable to save category. Please ensure the name is unique and try again.');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Settings</h1>
        <button
          onClick={openNewCategory}
          style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff' }}
        >
          Add Category
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {formVisible && (
        <div style={{ marginBottom: 24, padding: 18, background: '#f8fafc', borderRadius: 16, boxShadow: '0 8px 24px rgba(15,23,42,0.04)' }}>
          <h2>{editingCategoryId ? 'Edit Category' : 'Add Category'}</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
            <input
              value={categoryForm.name}
              onChange={(e) => handleCategoryChange(e.target.value)}
              required
              placeholder="Category name"
              style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
            />
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button type="submit" style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff' }}>
                {editingCategoryId ? 'Update Category' : 'Create Category'}
              </button>
              <button
                type="button"
                onClick={() => setFormVisible(false)}
                style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {categories.map((category) => (
          <div key={category.id} style={{ padding: 18, background: '#fff', borderRadius: 16, boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <h2 style={{ margin: 0 }}>{category.name}</h2>
              </div>
              <button
                onClick={() => openEditCategory(category)}
                style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#f59e0b', color: '#fff', height: 40 }}
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
