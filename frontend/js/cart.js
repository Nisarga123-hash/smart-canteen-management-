const API = 'http://localhost:5000/api';

const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const cartMessage = document.getElementById('cartMessage');

let currentTotal = 0;

async function loadCart() {
    try {
        const response = await fetch(`${API}/cart`, {
            credentials: 'include'
        });

        const data = await response.json();

        if (response.status === 401) {
            alert('Please login first.');
            window.location.href = 'login.html';
            return;
        }

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Unable to load cart');
        }

        displayCart(data.cart || []);
        currentTotal = Number(data.total || 0);

        cartTotal.textContent =
            `Total: ₹${currentTotal.toFixed(2)}`;

    } catch (error) {
        cartMessage.textContent = error.message;
    }
}

function displayCart(items) {
    cartItems.innerHTML = '';

    if (items.length === 0) {
        cartItems.textContent = 'Your cart is empty.';
        return;
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'cart-item';

        const details = document.createElement('div');

        const name = document.createElement('h3');
        name.textContent = item.food_name;

        const price = document.createElement('p');
        price.textContent =
            `Price: ₹${Number(item.price).toFixed(2)}`;

        const subtotal = document.createElement('p');
        subtotal.textContent =
            `Subtotal: ₹${Number(item.subtotal).toFixed(2)}`;

        details.append(name, price, subtotal);

        const controls = document.createElement('div');
        controls.className = 'quantity-controls';

        const minus = document.createElement('button');
        minus.textContent = '-';
        minus.addEventListener('click', () => {
            updateQuantity(item.cart_id, item.quantity - 1);
        });

        const quantity = document.createElement('strong');
        quantity.textContent = item.quantity;

        const plus = document.createElement('button');
        plus.textContent = '+';
        plus.addEventListener('click', () => {
            updateQuantity(item.cart_id, item.quantity + 1);
        });

        controls.append(minus, quantity, plus);

        const remove = document.createElement('button');
        remove.className = 'remove-btn';
        remove.textContent = 'Remove';
        remove.addEventListener('click', () => {
            removeItem(item.cart_id);
        });

        card.append(details, controls, remove);
        cartItems.appendChild(card);
    });
}

async function updateQuantity(cartId, quantity) {
    if (quantity < 1) {
        removeItem(cartId);
        return;
    }

    try {
        const response = await fetch(`${API}/cart/${cartId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quantity })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Unable to update quantity');
        }

        loadCart();

    } catch (error) {
        alert(error.message);
    }
}

async function removeItem(cartId) {
    try {
        const response = await fetch(`${API}/cart/${cartId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Unable to remove item');
        }

        loadCart();

    } catch (error) {
        alert(error.message);
    }
}

// PLACE ORDER AND CREATE PAYMENT RECORD
document.getElementById('placeOrderButton')
    .addEventListener('click', async () => {

        if (currentTotal <= 0) {
            alert('Your cart is empty.');
            return;
        }

        const button = document.getElementById('placeOrderButton');
        button.disabled = true;
        button.textContent = 'Placing order...';

        try {
            const orderResponse = await fetch(`${API}/orders/place`, {
                method: 'POST',
                credentials: 'include'
            });

            const orderData = await orderResponse.json();

            if (!orderResponse.ok || !orderData.success) {
                throw new Error(orderData.message || 'Order placement failed');
            }

            const orderId =
                orderData.order_id || orderData.orderId;

            if (!orderId) {
                throw new Error(
                    'Order was created, but the API did not return its order ID.'
                );
            }

            const paymentMethod =
                document.getElementById('paymentMethod').value;

            const paymentResponse = await fetch(`${API}/payments`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    order_id: orderId,
                    payment_method: paymentMethod
                })
            });

            const paymentData = await paymentResponse.json();

            if (!paymentResponse.ok || !paymentData.success) {
                alert(
                    `Order #${orderId} was created, but payment recording failed. ` +
                    (paymentData.message || '')
                );
                window.location.href = 'orders.html';
                return;
            }

            alert(
                `Order placed successfully!\n` +
                `Order ID: ${orderId}\n` +
                `Payment status: ${paymentData.payment_status}`
            );

            window.location.href = 'orders.html';

        } catch (error) {
            alert(error.message);
        } finally {
            button.disabled = false;
            button.textContent = 'Place Order';
        }
    });

loadCart();