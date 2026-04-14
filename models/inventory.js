class Inventory {
    costructor() {
        this.items = [];
        this.categories = [];
    }

    addItem(item) {
        this.items.push(item);
    }

    getItems(category_ids) {
        return this.items.filter((item) => {
            let has_all_categories = true;
            for (const cid of category_ids) {
                if (item.category_ids.indexOf(cid) === -1) {
                    has_all_categories = false;
                    break;
                }
            }
            return has_all_categories;
        });
    }

    deleteItem(id) {
        this.items = this.items.filter((item) => item.id !== id);
    }

    updateItem(item_id, new_item) {
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].id === item_id) {
                this.items[i] = new_item;
                break;
            }
        }
    }

    addCategory(category) {
        this.categories.push(category);
    }

    updateCategory(category_id, new_category) {
        for (let i = 0; i < this.categories.length; i++) {
            if (this.categories[i].id === category_id) {
                this.categories[i] = new_category;
            }
        }
    }

    deleteCategory(category_id) {
        for (let i = 0; i < this.items.length; i++) {
            const index = this.items[i].category_ids.indexOf(category_id);
            if (index === -1) {
                continue;
            }
            this.items.splice(index, 1);
        }
        this.categories = this.categories.filter((category) => category.id !== category_id);
    }
}

module.exports = new Inventory();