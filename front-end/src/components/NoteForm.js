import React, { useState, useEffect } from 'react';

const NoteForm = ({ onSubmit, initialData, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        content: initialData.content
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ title: '', content: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="note-form">
      <div className="form-group">
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Note Title"
          required
        />
      </div>
      <div className="form-group">
        <textarea
          name="content"
          value={formData.content}
          onChange={handleChange}
          placeholder="Note Content"
          required
          rows="4"
        />
      </div>
      <div className="form-buttons">
        <button type="submit">
          {initialData ? 'Update Note' : 'Add Note'}
        </button>
        {initialData && (
          <button type="button" onClick={onCancel} className="cancel-button">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default NoteForm;