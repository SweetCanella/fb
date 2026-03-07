import React, { useEffect, useState } from 'react';

export default function ProductModal({ open, mode, initialProduct, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');

  useEffect(() => {
    if (!open) return;
    
    setName(initialProduct?.name ?? '');
    setCategory(initialProduct?.category ?? '');
    setDescription(initialProduct?.description ?? '');
    setPrice(initialProduct?.price != null ? String(initialProduct.price) : '');
    setStock(initialProduct?.stock != null ? String(initialProduct.stock) : '');
  }, [open, initialProduct]);

  if (!open) return null;

  const title = mode === 'edit' ? 'Редактирование книги' : 'Добавление книги';

  const handleSubmit = (e) => {
    e.preventDefault();

    const nameTrimmed = name.trim();
    const categoryTrimmed = category.trim();
    const descriptionTrimmed = description.trim();
    const priceNum = Number(price);
    const stockNum = Number(stock);

    if (!nameTrimmed) {
      alert('Введите название книги');
      return;
    }

    if (!categoryTrimmed) {
      alert('Введите категорию');
      return;
    }

    if (!descriptionTrimmed) {
      alert('Введите описание');
      return;
    }

    if (!Number.isFinite(priceNum) || priceNum < 0) {
      alert('Введите корректную цену');
      return;
    }

    if (!Number.isInteger(stockNum) || stockNum < 0) {
      alert('Введите корректное количество на складе');
      return;
    }

    onSubmit({
      id: initialProduct?.id,
      name: nameTrimmed,
      category: categoryTrimmed,
      description: descriptionTrimmed,
      price: priceNum,
      stock: stockNum
    });
  };

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <div className="modal__title">{title}</div>
          <button className="iconBtn" onClick={onClose}>✕</button>
        </div>
        <form className="form" onSubmit={handleSubmit}>
          <label className="label">
            Название
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите название книги"
              autoFocus
            />
          </label>

          <label className="label">
            Категория
            <input
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Введите категорию"
            />
          </label>

          <label className="label">
            Описание
            <textarea
              className="textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Введите описание книги"
            />
          </label>

          <label className="label">
            Цена (₽)
            <input
              className="input"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Введите цену"
              inputMode="numeric"
            />
          </label>

          <label className="label">
            Количество на складе
            <input
              className="input"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="Введите количество"
              inputMode="numeric"
            />
          </label>

          <div className="modal__footer">
            <button type="button" className="btn" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn--primary">
              {mode === 'edit' ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}