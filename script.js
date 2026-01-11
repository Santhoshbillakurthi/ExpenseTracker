document.addEventListener("DOMContentLoaded", () => {
    const expenseForm = document.getElementById("expense-form");
    const expenseList = document.getElementById("expense-list");
    const totalAmount = document.getElementById("total-amount");
    const filterCategory = document.getElementById("filter-category");

    let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
    displayExpenses(expenses);
    updateTotalAmount();

    expenseForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const name = document.getElementById("expense-name").value;
        const amount = parseFloat(document.getElementById("expense-amount").value);
        const category = document.getElementById("expense-category").value;
        const date = document.getElementById("expense-date").value;

        const expense = {
            id: Date.now(),
            name,
            amount,
            category,
            date
        };

        expenses.push(expense);
        saveToLocalStorage();
        displayExpenses(expenses);
        updateTotalAmount();
        expenseForm.reset();
    });

    expenseList.addEventListener("click", (e) => {
        const id = parseInt(e.target.dataset.id);

        if (e.target.classList.contains("delete-btn")) {
            expenses = expenses.filter(exp => exp.id !== id);
        }

        if (e.target.classList.contains("edit-btn")) {
            const expense = expenses.find(exp => exp.id === id);
            document.getElementById("expense-name").value = expense.name;
            document.getElementById("expense-amount").value = expense.amount;
            document.getElementById("expense-category").value = expense.category;
            document.getElementById("expense-date").value = expense.date;
            expenses = expenses.filter(exp => exp.id !== id);
        }

        saveToLocalStorage();
        displayExpenses(expenses);
        updateTotalAmount();
    });

    filterCategory.addEventListener("change", (e) => {
        const category = e.target.value;
        if (category === "All") {
            displayExpenses(expenses);
        } else {
            const filtered = expenses.filter(exp => exp.category === category);
            displayExpenses(filtered);
        }
    });

    function displayExpenses(data) {
        expenseList.innerHTML = "";
        data.forEach(exp => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${exp.name}</td>
                <td>$${(exp.amount).toFixed(2)}</td>
                <td>${exp.category}</td>
                <td>${exp.date}</td>
                <td>
                    <button class="edit-btn" data-id="${exp.id}">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="delete-btn" data-id="${exp.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
            expenseList.appendChild(row);
        });
    }

    function updateTotalAmount() {
        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        totalAmount.textContent = total.toFixed(2);
    }

    function saveToLocalStorage() {
        localStorage.setItem("expenses", JSON.stringify(expenses));
    }
});

