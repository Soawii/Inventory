class Item {
    constructor(id, title, description, price, amount, category_ids) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.price = price;
        this.amount = amount;
        this.category_ids = category_ids;
    }
}

module.exports = Item;