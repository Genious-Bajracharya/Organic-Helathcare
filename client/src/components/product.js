import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import "../css/productDes.css";
import "../css/dashboard.css";
import Navbar from "./navbar";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState({});
  const [products, setProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [stockStatus, setStockStatus] = useState("");

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn");
    if (loggedIn) {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    axios
      .get(`http://localhost:3001/products/${id}`)
      .then((response) => {
        setProduct(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [id]);

  useEffect(() => {
    axios
      .get("http://localhost:3001/products")
      .then((response) => {
        setProducts(response.data);
      })
      .catch((error) => {});
  }, []);

  const handleAddToCart = async () => {
    if (isLoggedIn === false) {
      alert("You need to log in to add products to your cart.");
      return;
    }
    ///////////////////////////////////
    const productId = product.id;
    const username = localStorage.getItem("username");
    if (quantity > product.stock) {
      alert("Quantity not in Stock");
    } else {
      try {
        const res = await axios.post("http://localhost:3001/cart", {
          product,
          username,
          quantity,
        });
        console.log(res.data.message);
        alert(`Added to cart successfully`);
      } catch (error) {
        console.error(error);
        alert("Product already added");
      }
    }
  };

  const handleQuantityChange = (e) => {
    setQuantity(Number(e.target.value));
  };

  return (
    <div>
      <Navbar />
      <div className="product-page">
        <div className="product-description">
          <div className="product-images">
            <img
              src={`data:image/jpeg;base64,${product.pic}`}
              alt={product.Name}
            />
          </div>
          <div className="product-details">
            <h2>{product.Name}</h2>
            <p className="product-price">RS. {product.price}</p>
            <p>
              In Stock: {stockStatus}
              {product.stock}
            </p>
            <p className="product-description-text">{product.description}</p>
            <p> Quantity:</p>
            <div className="product-quantity">
              <input
                type="number"
                id="quantity"
                name="quantity"
                placeholder="1"
                min="1"
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <button onClick={() => handleAddToCart()}>Add to Cart</button>
          </div>
        </div>
      </div>
      <div className="new">
        <h2>More Products </h2>
      </div>

      <div className="products-container">
        {products
          .sort(() => Math.random() - 0.5)
          .slice(0, 5)
          .map((pro) => (
            <Link to={`/product/${pro.id}`}>
              <div className="product-card" key={pro.id}>
                <img src={`data:image/jpeg;base64,${pro.pic}`} alt={pro.Name} />

                <h3>{pro.Name}</h3>
                <p>RS. {pro.price}</p>
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
};

export default ProductDetail;
