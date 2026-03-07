import React from 'react';

export default function ProductItem({ product, onEdit, onDelete }) {
  return (
    <div className="productRow">
      <div className="productMain">
        <div className="productInfo">
          <div className="productTitle">
            <span className="productId">#{product.id}</span>
            <span className="productName">{product.name}</span>
            <span className="productCategory">{product.category}</span>
          </div>
          <div className="productDescription">{product.description}</div>
          <div className="productDetails">
            <span className="productPrice">{product.price} ₽</span>
            <span className="productStock">В наличии: {product.stock} шт.</span>
          </div>
        </div>
        <div className="productActions">
          <button className="btn" onClick={() => onEdit(product)}>
            Редактировать
          </button>
          <button className="btn btn--danger" onClick={() => onDelete(product.id)}>
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
}