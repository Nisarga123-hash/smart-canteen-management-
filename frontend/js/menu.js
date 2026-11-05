const API_URL = 'http://localhost:5000/api';

const foodContainer = document.getElementById('foodContainer');
const searchInput = document.getElementById('searchInput');
const categorySelect = document.getElementById('categorySelect');

let allFoods = [];

async function loadFoods() {
    try {
        const response = await fetch(`${API_URL}/foods`);
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Unable to load foods');
        }

        allFoods = data.foods;
        displayFoods(allFoods);

    } catch (error) {
        document.getElementById('menuMessage').textContent =
            error.message;
    }
}

function displayFoods(foods) {
    foodContainer.innerHTML = '';

    if (foods.length === 0) {
        foodContainer.innerHTML = '<p>No food items found.</p>';
        return;
    }

    foods.forEach(food => {
        const card = document.createElement('div');
        card.className = 'food-card';

        const image = document.createElement('img');
        image.src = food.image_url || 'https://placehold.co/400x250?text=Food';
        image.alt = food.food_name;
        image.onerror = () => {
            image.src = 'https://placehold.co/400x250?text=Food';
        };

        const info = document.createElement('div');
        info.className = 'food-info';

        const name = document.createElement('h3');
        name.textContent = food.food_name;

        const description = document.createElement('p');
        description.textContent = food.description || 'Freshly prepared';

        const category = document.createElement('p');
        category.textContent = food.category_name || '';

        const price = document.createElement('div');
        price.className = 'food-price';
        price.textContent = `₹${Number(food.price).toFixed(2)}`;

        const button = document.createElement('button');
        button.className = 'btn';
        button.textContent = 'Add to Cart';

        button.addEventListener('click', () => {
            addToCart(food.food_id);
        });

        info.append(name, description, category, price, button);
        card.append(image, info);
        foodContainer.appendChild(card);
    });
}

async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/foods/categories`);
        const data = await response.json();

        if (!response.ok || !data.success) return;

        data.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.category_id;
            option.textContent = category.category_name;
            categorySelect.appendChild(option);
        });

    } catch (error) {
        console.error('Category loading error:', error);
    }
}

async function addToCart(foodId) {
    try {
        const response = await fetch(`${API_URL}/cart/add`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                food_id: foodId,
                quantity: 1
            })
        });

        const data = await response.json();

        if (response.status === 401) {
            alert('Please login to add food to your cart.');
            window.location.href = 'login.html';
            return;
        }

        alert(data.message);

    } catch (error) {
        alert('Unable to connect to server.');
    }
}

async function searchFoods() {
    const query = searchInput.value.trim();

    if (!query) {
        filterByCategory();
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/foods/search?q=${encodeURIComponent(query)}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Search failed');
        }

        displayFoods(data.foods);

    } catch (error) {
        document.getElementById('menuMessage').textContent =
            error.message;
    }
}

async function filterByCategory() {
    const categoryId = categorySelect.value;

    if (!categoryId) {
        loadFoods();
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/foods/category/${categoryId}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Unable to filter foods');
        }

        displayFoods(data.foods);

    } catch (error) {
        document.getElementById('menuMessage').textContent =
            error.message;
    }
}

searchInput.addEventListener('input', searchFoods);

categorySelect.addEventListener('change', () => {
    searchInput.value = '';
    filterByCategory();
});

document.getElementById('logoutButton').addEventListener('click', async (e) => {
    e.preventDefault();

    try {
        await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });

        window.location.href = 'login.html';

    } catch (error) {
        alert('Logout failed.');
    }
});

loadCategories();
loadFoods();