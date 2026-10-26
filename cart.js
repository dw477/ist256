"use strict";

$(document).ready(function () {

  let products = [];
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  function loadProducts() {
    const savedPosts = localStorage.getItem("posts");

    if (savedPosts) {
      try {
        const saved = JSON.parse(savedPosts);
        if (Array.isArray(saved)) {
          products = saved;
          displayProducts(products);
          return;
        }
      } catch (error) {
        console.error("Invalid saved posts:", error);
      }
    }

    $.getJSON("posts.json", function (data) {
      products = data.posts;
      displayProducts(products);
    }).fail(function () {
      showMessage("Unable to load posts.json.", "red");
    });
  }
  function displayProducts(items) {
    $("#productList").empty();

    items.forEach(function (item) {
      const row = $("<tr>");

      $("<td>").text(item.id).appendTo(row);
      $("<td>").text(item.description).appendTo(row);
      $("<td>").text(item.category).appendTo(row);
      $("<td>").text(item.format).appendTo(row);
      $("<td>").text(item.value + " min").appendTo(row);

      const button = $("<button>")
        .text("Add to Cart")
        .addClass("btn btn-primary btn-sm")
        .on("click", function () {
          addToCart(item.id);
        });

      $("<td>").append(button).appendTo(row);
      $("#productList").append(row);
    });
  }
  function addToCart(id) {
    const product = products.find(function (item) {
      return item.id === id;
    });

    if (!product) {
      showMessage("Article not found.", "red");
      return;
    }
    const exists = cart.some(function (item) {
      return item.id === id;
    });

    if (exists) {
      showMessage("This article is already in your cart.", "red");
      return;
    }

    cart.push(product);
    saveCart();
    displayCart();

    showMessage("Article added successfully!", "green");
  }
  function removeFromCart(id) {
    cart = cart.filter(function (item) {
      return item.id !== id;
    });

    saveCart();
    displayCart();

    showMessage("Article removed successfully!", "green");
  }
  function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
  }
  function displayCart() {
    $("#cartList").empty();

    cart.forEach(function (item) {
      const row = $("<tr>");

      $("<td>").text(item.description).appendTo(row);
      $("<td>").text(item.category).appendTo(row);
      $("<td>").text(item.value + " min").appendTo(row);

      const button = $("<button>")
        .text("Remove")
        .addClass("btn btn-danger btn-sm")
        .on("click", function () {
          removeFromCart(item.id);
        });

      $("<td>").append(button).appendTo(row);
      $("#cartList").append(row);
    });

    $("#cartCount").text(cart.length);
  }
  $("#cartSearch").on("input", function () {
    const search = $(this).val().toLowerCase().trim();

    const results = products.filter(function (item) {
      return (
        String(item.id).includes(search) ||
        item.description.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search)
      );
    });

    displayProducts(results);
  });
  function showMessage(text, color) {
    $("#cartMessage").text(text).css("color", color);
  }
  function prepareCartJSON() {
    const cartData = {
      items: cart.map(function (item) {
        return {
          id: item.id,
          description: item.description,
          category: item.category,
          format: item.format,
          price: item.price ?? 0,
          value: item.value
        };
      })
    };

    return JSON.stringify(cartData, null, 2);
  }
  $("#previewJSON").on("click", function () {
    $("#jsonOutput").text(prepareCartJSON());
    showMessage("JSON prepared successfully!", "green");
  });
  $("#sendCart").on("click", function () {
    if (cart.length === 0) {
      showMessage("Error: Your cart is empty.", "red");
      return;
    }
    $("#jsonOutput").text(prepareCartJSON());

    $.ajax({
      url: "/api/cart",
      method: "POST",
      contentType: "application/json",
      data: prepareCartJSON(),

      success: function (response) {
        showMessage("Cart sent successfully!", "green");
        console.log("API response:", response);
      },

      error: function () {
        showMessage(
          "API not available yet. JSON is ready for future submission.",
          "orange"
        );
      }
    });
  });
  displayCart();
  loadProducts();

});
