expense.js
document.addEventListener("DOMContentLoaded", () => {
  // Get the logged-in user from localStorage
  const loggedUser = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!loggedUser || !loggedUser.username) {
    window.location.href = "login.html"; // Redirect if not logged in or username is missing
  }

  const storageKey = `expenses_${loggedUser.username}`;

  const expenseForm = document.getElementById("expense-form");
  const expenseList = document.getElementById("expense-list");
  const budgetInput = document.getElementById("budget-input");
  const totalIncomeElement = document.getElementById("total-income");
  const totalExpenseElement = document.getElementById("total-expense");
  const savingsElement = document.getElementById("savings");
  const budgetWarning = document.getElementById("budget-warning");

  // Currency formatter
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);

  // Initialize chart
  const ctx = document.getElementById("expenseChart").getContext("2d");
  let expenseChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Food", "Transport", "Entertainment", "Shopping", "Other"],
      datasets: [
        {
          label: "Expense by Category",
          data: [0, 0, 0, 0, 0], // Data will be updated dynamically
          backgroundColor: ["#FF5733", "#33FF57", "#3357FF", "#FF33A6", "#FF8C00"],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        tooltip: {
          callbacks: {
            label: function (tooltipItem) {
              const value = tooltipItem.raw;
              return formatCurrency(value);
            },
          },
        },
      },
    },
  });

  // Retrieve existing expenses from localStorage
  let expenses = JSON.parse(localStorage.getItem(storageKey)) || [];
  let totalIncome = 0;
  let totalExpense = 0;

  // Handle form submission for adding an expense
  expenseForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const expenseName = document.getElementById("expense-name").value;
    const expenseAmount = parseFloat(document.getElementById("expense-amount").value);
    const expenseCategory = document.getElementById("expense-category").value;
    const expenseDate = document.getElementById("expense-date").value;

    if (!expenseName || isNaN(expenseAmount) || expenseAmount <= 0 || !expenseCategory || !expenseDate) {
      alert("Please fill in all fields correctly.");
      return;
    }

    const newExpense = {
      name: expenseName,
      amount: expenseAmount,
      category: expenseCategory,
      date: expenseDate,
    };

    expenses.push(newExpense);
    localStorage.setItem(storageKey, JSON.stringify(expenses));
    renderExpenses();
    updateTotals();
    updateChart(); // Update chart with new data
    expenseForm.reset();
  });

  // Function to render the expenses in the table
  function renderExpenses() {
    expenseList.innerHTML = "";

    // Get filter values
    const filterCategory = document.getElementById("filter-category").value;
    const filterPeriod = document.getElementById("filter-period").value;
    const filteredExpenses = filterExpenses(filterCategory, filterPeriod);

    if (filteredExpenses.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = "<td colspan='5'>No expenses to display</td>";
      expenseList.appendChild(row);
    } else {
      filteredExpenses.forEach((expense, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${expense.name}</td>
          <td>${formatCurrency(expense.amount)}</td>
          <td>${expense.category}</td>
          <td>${expense.date}</td>
          <td>
            <button class="edit-btn" data-index="${index}" style="background-color: #ffa500; color: white; padding: 5px 10px; border: none; cursor: pointer;">Edit</button>
            <button class="delete-btn" data-index="${index}" style="background-color: red; color: white; padding: 5px 10px; border: none; cursor: pointer;">Delete</button>
          </td>
        `;
        expenseList.appendChild(row);
      });
    }

    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", (event) => {
        const index = event.target.dataset.index;
        deleteExpense(index);
      });
    });

    document.querySelectorAll(".edit-btn").forEach((button) => {
      button.addEventListener("click", (event) => {
        const index = event.target.dataset.index;
        editExpense(index);
      });
    });
  }

  // Function to filter expenses based on category and period
  function filterExpenses(category, period) {
    let filteredExpenses = expenses;

    // Filter by category
    if (category !== "All") {
      filteredExpenses = filteredExpenses.filter((expense) => expense.category === category);
    }

    // Filter by time period
    const today = new Date();
    if (period === "Monthly") {
      filteredExpenses = filteredExpenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === today.getMonth() && expenseDate.getFullYear() === today.getFullYear();
      });
    } else if (period === "Weekly") {
      const startOfWeek = today.setDate(today.getDate() - today.getDay()); // Get the start of the week
      filteredExpenses = filteredExpenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startOfWeek;
      });
    }

    return filteredExpenses;
  }

  // Function to delete an expense
  function deleteExpense(index) {
    expenses.splice(index, 1);
    localStorage.setItem(storageKey, JSON.stringify(expenses));
    renderExpenses();
    updateTotals();
    updateChart(); // Update chart after deletion
  }

  // Function to edit an expense
  function editExpense(index) {
    const expense = expenses[index];
    document.getElementById("expense-name").value = expense.name;
    document.getElementById("expense-amount").value = expense.amount;
    document.getElementById("expense-category").value = expense.category;
    document.getElementById("expense-date").value = expense.date;

    const submitButton = document.getElementById("set-income-btn");
    submitButton.innerText = "Update Expense";

    expenseForm.removeEventListener("submit", addExpense); // Just in case
    expenseForm.addEventListener("submit", function updateExpense(event) {
      event.preventDefault();

      const updatedName = document.getElementById("expense-name").value;
      const updatedAmount = parseFloat(document.getElementById("expense-amount").value);
      const updatedCategory = document.getElementById("expense-category").value;
      const updatedDate = document.getElementById("expense-date").value;

      expenses[index] = {
        name: updatedName,
        amount: updatedAmount,
        category: updatedCategory,
        date: updatedDate,
      };

      localStorage.setItem(storageKey, JSON.stringify(expenses));

      submitButton.innerText = "Set"; // Reset button text
      expenseForm.removeEventListener("submit", updateExpense);
      expenseForm.addEventListener("submit", addExpense);
      expenseForm.reset();

      renderExpenses();
      updateTotals();
      updateChart(); // Update chart after edit
    });
  }

  // Function to update the totals
  function updateTotals() {
    totalIncome = parseFloat(totalIncomeElement.getAttribute("data-raw")) || 0;
    totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    totalExpenseElement.innerText = formatCurrency(totalExpense);
    savingsElement.innerText = formatCurrency(totalIncome - totalExpense);

    const budgetLimit = parseFloat(budgetInput.value) || 0;
    if (totalExpense > budgetLimit && budgetLimit > 0) {
      budgetWarning.style.display = "block";
    } else {
      budgetWarning.style.display = "none";
    }
  }

  // Function to update the chart
  function updateChart() {
    // Get the expense data by category
    const categoryData = ["Food", "Transport", "Entertainment", "Shopping", "Other"].map((category) => {
      return expenses.filter((expense) => expense.category === category).reduce((sum, expense) => sum + expense.amount, 0);
    });

    // Update chart with the new data
    expenseChart.data.datasets[0].data = categoryData;
    expenseChart.update();
  }

  // Income & budget setup
  document.getElementById("set-income-btn").addEventListener("click", () => {
    const income = parseFloat(document.getElementById("income-input").value);
    const budget = parseFloat(budgetInput.value);

    if (!isNaN(income) && income >= 0) {
      totalIncome = income;
      totalIncomeElement.innerText = formatCurrency(totalIncome);
      totalIncomeElement.setAttribute("data-raw", totalIncome); // Store raw value
      updateTotals();
    }

    if (!isNaN(budget) && budget >= 0) {
      updateTotals(); 
    }
  });

  // Filter change events
  document.getElementById("filter-category").addEventListener("change", renderExpenses);
  document.getElementById("filter-period").addEventListener("change", renderExpenses);

  renderExpenses();
  updateTotals();
  updateChart(); // Initialize the chart
});
