import React, { useEffect, useState } from 'react';

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state for inline create / update
  const [createName, setCreateName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [newlyAddedId, setNewlyAddedId] = useState(null);

  // base API (used for GET and DELETE)
  const API_BASE = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;
  const ITEMS_PATH = `${API_BASE}/items`;

  useEffect(() => {
    let mounted = true;
    const fetchItems = async () => {
      try {
        setLoading(true);
        const res = await fetch(ITEMS_PATH);
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const data = await res.json();
        if (mounted) setItems(data);
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchItems();
    return () => { mounted = false; };
  }, [ITEMS_PATH]);

  const deleteItem = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      const res = await fetch(`${API_BASE}/delete/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status} ${res.statusText} — ${text}`);
      }
      // remove item from UI
      setItems(prev => prev.filter(i => (i._id ?? i.id) !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  // inline update (textbox)
  const startEdit = (item) => {
    setEditingId(item._id ?? item.id);
    setEditingName(item.name ?? '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const saveEdit = async (id) => {
    const nameTrim = (editingName ?? '').trim();
    if (nameTrim === '') {
      window.alert('Name cannot be empty');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/update/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameTrim }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status} ${res.statusText} — ${text}`);
      }
      const updated = await res.json();
      setItems(prev => prev.map(i => ((i._id ?? i.id) === id ? updated : i)));
      cancelEdit();
    } catch (err) {
      setError(err.message);
    }
  };

  // inline create (textbox)
  // const createItem = async () => {
  //   const nameTrim = (createName ?? '').trim();
  //   if (nameTrim === '') {
  //     window.alert('Name cannot be empty');
  //     return;
  //   }
  //   try {
  //     const res = await fetch(`${API_BASE}/add`, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ name: nameTrim }),
  //     });
  //     if (!res.ok) {
  //       const text = await res.text();
  //       throw new Error(`${res.status} ${res.statusText} — ${text}`);
  //     }
  //     const created = await res.json();
  //     setItems(prev => [created, ...prev]);
  //     // clear create input
  //     setCreateName('');
  //   } catch (err) {
  //     setError(err.message);
  //   }
  // };

  const createItem = async () => {
    const nameTrim = (createName ?? '').trim();
    if (nameTrim === '') {
      window.alert('Name cannot be empty');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameTrim }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status} ${res.statusText} — ${text}`);
      }
      const created = await res.json();
      setItems(prev => [created, ...prev]);
      // mark the item as newly added so we can animate it
      const addedId = created._id ?? created.id;
      setNewlyAddedId(addedId);

      // clear create input
      setCreateName('');
      // remove the "new" marker after animation duration

      // setLoading(true);
      // setTimeout(() => setNewlyAddedId(null), 500);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div>Loading items...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        Items
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            aria-label="Create item name"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') createItem(); }}
            placeholder="New item name"
            style={{ padding: '4px 8px' }}
          />
          <button onClick={createItem}>Create</button>
        </div>
      </h1>

      {items.length === 0 ? (
        <div>No items found.</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {items.map(item => {
            const keyId = item._id ?? item.id;
            const isEditing = editingId === keyId;
             const isNew = newlyAddedId === keyId;
            return (
              <div key={keyId} 
               className={isNew ? 'item-enter' : undefined}
              style={{ display: '', alignItems: 'center', gap: 0, padding: '6px' }}>
                {isEditing ? (
                  <>
                    <input
                      aria-label={`Edit name for ${item.name}`}
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(keyId);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      style={{ padding: '4px 8px', flex: '1 1 auto' }}
                    />
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                      <button onClick={() => saveEdit(keyId)}>Save</button>
                      <button onClick={cancelEdit}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <span style={{ flex: '1 1 auto' }}>{item.name}</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                      <button onClick={() => startEdit(item)}>Update</button>
                      <button onClick={() => deleteItem(keyId)}>Delete</button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default App;
// ...existing code...