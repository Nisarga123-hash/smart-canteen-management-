const API = 'http://localhost:5000/api';

const ordersContainer =
    document.getElementById('ordersContainer');

const ordersMessage =
    document.getElementById('ordersMessage');

async function loadOrders() {
    try {
        const response = await fetch(`${API}/orders/my-orders`, {
            credentials: 'include'
        });

        const data = await response.json();

        if (response.status === 401) {
            alert('Please login first.');
            window.location.href = 'login.html';
            return;
        }

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Unable to load orders');
        }

        displayOrders(data.orders || []);

    } catch (error) {
        ordersMessage.textContent = error.message;
    }
}

function displayOrders(orders) {
    ordersContainer.innerHTML = '';

    if (orders.length === 0) {
        ordersContainer.textContent = 'You have not placed any orders yet.';
        return;
    }

    orders.forEach(order => {
        const card = document.createElement('div');
        card.className = 'order-card';

        const title = document.createElement('h3');
        title.textContent = `Order #${order.order_id}`;

        const date = document.createElement('p');
        date.textContent =
            `Date: ${new Date(order.order_date).toLocaleString()}`;

        const amount = document.createElement('p');
        amount.textContent =
            `Total: ₹${Number(order.total_amount).toFixed(2)}`;

        const status = document.createElement('span');
        status.className = 'status';
        status.textContent = order.order_status;

        card.append(title, date, amount, status);

        if (order.order_status === 'Pending') {
            const cancelButton = document.createElement('button');
            cancelButton.className = 'remove-btn';
            cancelButton.textContent = 'Cancel Order';

            cancelButton.addEventListener('click', () => {
                cancelOrder(order.order_id);
            });

            card.appendChild(cancelButton);
        }

        ordersContainer.appendChild(card);
    });
}

async function cancelOrder(orderId) {
    const confirmed = confirm(
        `Are you sure you want to cancel order #${orderId}?`
    );

    if (!confirmed) return;

    try {
        const response = await fetch(
            `${API}/orders/${orderId}/cancel`,
            {
                method: 'PUT',
                credentials: 'include'
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Cancellation failed');
        }

        alert('Order cancelled successfully.');
        loadOrders();

    } catch (error) {
        alert(error.message);
    }
}

loadOrders();