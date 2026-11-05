const API = 'http://localhost:5000/api';

let foods = [];
let orders = [];
let salesChart = null;

const foodTable = document.getElementById('foodTable');
const orderTable = document.getElementById('orderTable');

// Helper: API requests with admin session cookie
async function apiRequest(url, options = {}) {
    const response = await fetch(`${API}${url}`, {
        ...options,
        credentials: 'include',
        headers: {
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...options.headers
        }
    });

    const data = await response.json();

    if (response.status === 401) {
        window.location.href = 'admin-login.html';
        throw new Error('Admin login required');
    }

    if (!response.ok || data.success === false) {
        throw new Error(data.message || 'Request failed');
    }

    return data;
}

// LOAD DASHBOARD
async function loadDashboard() {
    try {
        const [salesData, orderData, foodData] = await Promise.all([
            apiRequest('/admin/reports/sales'),
            apiRequest('/admin/orders'),
            apiRequest('/admin/foods')
        ]);

        orders = orderData.orders || [];
        foods = foodData.foods || [];

        document.getElementById('totalSales').textContent =
            `₹${Number(salesData.summary.total_sales).toFixed(2)}`;

        document.getElementById('successfulPayments').textContent =
            salesData.summary.successful_payments;

        document.getElementById('totalOrders').textContent =
            orders.length;

        document.getElementById('totalFoods').textContent =
            foods.length;

        displayFoods();
        displayOrders();
        displaySalesChart(salesData.dailySales || []);

    } catch (error) {
        console.error(error);
    }
}

// DISPLAY FOOD ITEMS
function displayFoods() {
    foodTable.innerHTML = '';

    foods.forEach(food => {
        const row = document.createElement('tr');

        const id = document.createElement('td');
        id.textContent = food.food_id;

        const name = document.createElement('td');
        name.textContent = food.food_name;

        const price = document.createElement('td');
        price.textContent = `₹${Number(food.price).toFixed(2)}`;

        const availability = document.createElement('td');
        availability.textContent =
            food.availability ? 'Available' : 'Unavailable';

        const actions = document.createElement('td');

        const edit = document.createElement('button');
        edit.className = 'edit-btn';
        edit.textContent = 'Edit';
        edit.addEventListener('click', () => editFood(food.food_id));

        const disable = document.createElement('button');
        disable.className = 'disable-btn';
        disable.textContent = 'Disable';
        disable.disabled = !food.availability;
        disable.addEventListener('click', () => disableFood(food.food_id));

        actions.append(edit, disable);
        row.append(id, name, price, availability, actions);
        foodTable.appendChild(row);
    });
}

// CLEAR FOOD FORM
function clearFoodForm() {
    document.getElementById('foodForm').reset();
    document.getElementById('foodId').value = '';
    document.getElementById('foodMessage').textContent = '';
}

document.getElementById('clearFormButton')
    .addEventListener('click', clearFoodForm);

// EDIT FOOD
function editFood(foodId) {
    const food = foods.find(item => item.food_id === foodId);

    if (!food) return;

    document.getElementById('foodId').value = food.food_id;
    document.getElementById('foodName').value = food.food_name;
    document.getElementById('categoryId').value = food.category_id;
    document.getElementById('description').value = food.description || '';
    document.getElementById('price').value = food.price;
    document.getElementById('imageUrl').value = food.image_url || '';
    document.getElementById('availability').value =
        food.availability ? '1' : '0';

    document.getElementById('foods').scrollIntoView({
        behavior: 'smooth'
    });
}

// ADD OR UPDATE FOOD
document.getElementById('foodForm')
    .addEventListener('submit', async (e) => {

        e.preventDefault();

        const foodId = document.getElementById('foodId').value;

        const food = {
            food_name: document.getElementById('foodName').value.trim(),
            category_id: Number(document.getElementById('categoryId').value),
            description: document.getElementById('description').value.trim(),
            price: Number(document.getElementById('price').value),
            image_url: document.getElementById('imageUrl').value.trim() || null,
            availability: Number(document.getElementById('availability').value)
        };

        const message = document.getElementById('foodMessage');

        try {
            const url = foodId
                ? `/admin/foods/${foodId}`
                : '/admin/foods';

            const method = foodId ? 'PUT' : 'POST';

            const data = await apiRequest(url, {
                method,
                body: JSON.stringify(food)
            });

            message.textContent = data.message;
            clearFoodForm();
            await loadDashboard();

        } catch (error) {
            message.textContent = error.message;
        }
    });

// DISABLE FOOD
async function disableFood(foodId) {
    if (!confirm('Are you sure you want to disable this food item?')) {
        return;
    }

    try {
        const data = await apiRequest(`/admin/foods/${foodId}`, {
            method: 'DELETE'
        });

        alert(data.message);
        await loadDashboard();

    } catch (error) {
        alert(error.message);
    }
}

// DISPLAY ORDERS
function displayOrders() {
    orderTable.innerHTML = '';

    if (orders.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 6;
        cell.textContent = 'No orders found.';
        row.appendChild(cell);
        orderTable.appendChild(row);
        return;
    }

    orders.forEach(order => {
        const row = document.createElement('tr');

        const values = [
            order.order_id,
            order.student_name,
            `₹${Number(order.total_amount).toFixed(2)}`,
            order.payment_method
                ? `${order.payment_method} (${order.payment_status})`
                : 'Not recorded'
        ];

        values.forEach(value => {
            const cell = document.createElement('td');
            cell.textContent = value ?? '-';
            row.appendChild(cell);
        });

        const statusCell = document.createElement('td');

        const statusSelect = document.createElement('select');

        const statuses = [
            'Pending',
            'Preparing',
            'Ready',
            'Completed',
            'Cancelled'
        ];

        statuses.forEach(status => {
            const option = document.createElement('option');
            option.value = status;
            option.textContent = status;
            statusSelect.appendChild(option);
        });

        statusSelect.value = order.order_status;
        statusCell.appendChild(statusSelect);

        const updateCell = document.createElement('td');

        const updateButton = document.createElement('button');
        updateButton.className = 'edit-btn';
        updateButton.textContent = 'Update';

        updateButton.addEventListener('click', async () => {
            try {
                const data = await apiRequest(
                    `/admin/orders/${order.order_id}/status`,
                    {
                        method: 'PUT',
                        body: JSON.stringify({
                            status: statusSelect.value
                        })
                    }
                );

                alert(data.message);
                await loadDashboard();

            } catch (error) {
                alert(error.message);
            }
        });

        updateCell.appendChild(updateButton);

        row.append(statusCell, updateCell);
        orderTable.appendChild(row);
    });
}

// SALES CHART
function displaySalesChart(dailySales) {
    const canvas = document.getElementById('salesChart');

    if (salesChart) {
        salesChart.destroy();
    }

    const chartData = [...dailySales].reverse();

    salesChart = new Chart(canvas, {
        type: 'bar',

        data: {
            labels: chartData.map(item =>
                new Date(item.sales_date).toLocaleDateString()
            ),

            datasets: [{
                label: 'Daily Sales (₹)',
                data: chartData.map(item =>
                    Number(item.total_sales)
                ),
                borderWidth: 1
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: true,

            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// ADMIN LOGOUT
document.getElementById('logoutButton')
    .addEventListener('click', async () => {

        try {
            await apiRequest('/admin/logout', {
                method: 'POST'
            });

            window.location.href = 'admin-login.html';

        } catch (error) {
            alert(error.message);
        }
    });

// LOAD DATA
loadDashboard();