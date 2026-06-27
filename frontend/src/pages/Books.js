import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../auth';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const initialForm = {
  isbn: '',
  title: '',
  author: '',
  publisher: '',
  category: '',
  publication_year: '',
  total_copies: 1,
};

export default function Books() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBookId, setCurrentBookId] = useState(null);
  const { user } = useAuth();
  const isLibrarian = user?.role === 'librarian';

  const loadBooks = () => {
    setError('');
    axios
      .get(`${BASE_URL}/books/?search=${encodeURIComponent(search)}`)
      .then((resp) => setBooks(resp.data.results || resp.data))
      .catch(() => setError('Unable to load books'));
  };

  const loadCategories = () => {
    axios
      .get(`${BASE_URL}/categories/`)
      .then((resp) => setCategories(resp.data.results || resp.data))
      .catch(() => {});
  };

  useEffect(() => {
    loadBooks();
    loadCategories();
  }, []);

  const showNewBookForm = () => {
    setFormVisible(true);
    setFormData(initialForm);
    setIsEditing(false);
    setCurrentBookId(null);
    setError('');
  };

  const showEditBookForm = (book) => {
    setFormVisible(true);
    setIsEditing(true);
    setCurrentBookId(book.id);
    setFormData({
      isbn: book.isbn || '',
      title: book.title || '',
      author: book.author || '',
      publisher: book.publisher || '',
      category: book.category || '',
      publication_year: book.publication_year || '',
      total_copies: book.total_copies || 0,
    });
    setError('');
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const payload = {
        isbn: formData.isbn,
        title: formData.title,
        author: formData.author,
        publisher: formData.publisher,
        category: formData.category || null,
        publication_year: formData.publication_year || null,
        total_copies: Number(formData.total_copies),
      };
      if (isEditing && currentBookId) {
        await axios.put(`${BASE_URL}/books/${currentBookId}/`, payload);
      } else {
        await axios.post(`${BASE_URL}/books/`, payload);
      }
      setFormVisible(false);
      loadBooks();
    } catch (err) {
      setError('Unable to save book. Please check the values and try again.');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Books</h1>
        {isLibrarian && (
          <button
            onClick={showNewBookForm}
            style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff' }}
          >
            Add Book
          </button>
        )}
      </div>

      <div style={{ display: 'flex', marginBottom: 16, gap: 8 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search books..."
          style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
        />
        <button onClick={loadBooks} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff' }}>
          Search
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!isLibrarian && <p style={{ color: '#6b7280' }}>Only librarians can add or edit books.</p>}

      {formVisible && isLibrarian && (
        <div style={{ marginBottom: 24, padding: 18, background: '#f8fafc', borderRadius: 16, boxShadow: '0 8px 24px rgba(15,23,42,0.04)' }}>
          <h2>{isEditing ? 'Edit Book' : 'Add Book'}</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
            <input
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Title"
              required
              style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
            />
            <input
              value={formData.author}
              onChange={(e) => handleChange('author', e.target.value)}
              placeholder="Author"
              required
              style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
            />
            <input
              value={formData.isbn}
              onChange={(e) => handleChange('isbn', e.target.value)}
              placeholder="ISBN"
              required
              style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
            />
            <input
              value={formData.publisher}
              onChange={(e) => handleChange('publisher', e.target.value)}
              placeholder="Publisher"
              style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <input
                type="number"
                value={formData.publication_year}
                onChange={(e) => handleChange('publication_year', e.target.value)}
                placeholder="Publication year"
                style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <input
                type="number"
                min="0"
                value={formData.total_copies}
                onChange={(e) => handleChange('total_copies', e.target.value)}
                placeholder="Total copies"
                required
                style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
              />
              <div />
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button type="submit" style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff' }}>
                {isEditing ? 'Update Book' : 'Create Book'}
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
        {books.map((book) => (
          <div key={book.id} style={{ padding: 18, background: '#fff', borderRadius: 16, boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <h2 style={{ margin: 0 }}>{book.title}</h2>
                <p style={{ margin: '8px 0 0', color: '#6b7280' }}>{book.author} · {book.isbn}</p>
                <p style={{ margin: '8px 0 0' }}>Available: {book.available_copies} / {book.total_copies}</p>
              </div>
              {isLibrarian && (
                <button
                  onClick={() => showEditBookForm(book)}
                  style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#f59e0b', color: '#fff', height: 40 }}
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
