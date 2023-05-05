const express = require("express");
const router = express.Router();

// #1 import in the Product model
const {Product, Category, Tag} = require('../models')
// import in the Forms
const { bootstrapField, createProductForm } = require('../forms');

router.get('/', async (req,res)=>{
    // #2 - fetch all the products (ie, SELECT * from products)
    let products = await Product.collection().fetch({
        withRelated:['category', 'tags']
    });
    res.render('products/index', {
        'products': products.toJSON() // #3 - convert collection to JSON
    })
})

router.get('/create', async (req, res) => {

    const allCategories = await Category.fetchAll().map((category) => {
        return [category.get("id"), category.get('name')]
    })

    const allTags = await Tag.fetchAll().map( tag => {
        return [tag.get('id'), tag.get('name')]
    })

    const productForm = createProductForm(allCategories, allTags);
    res.render('products/create',{
        'form': productForm.toHTML(bootstrapField)
    })
})

router.post('/create', async(req,res)=>{

    const allCategories = await Category.fetchAll().map((category) => {
        return [category.get("id"), category.get('name')]
    })

    const allTags = await Tag.fetchAll().map( tag => {
        return [tag.get('id'), tag.get('name')]
    })
    
    const productForm = createProductForm(allCategories, allTags);
    productForm.handle(req, {
        'success': async (form) => {
            const product = new Product();
            product.set('name', form.data.name);
            product.set('cost', form.data.cost);
            product.set('description', form.data.description);
            product.set('category_id', form.data.category_id);
            await product.save();

            if (form.data.tags) {
                const tagArray = form.data.tags.split(', ');
                await product.tags().attach(tagArray);
            }
            
            res.redirect('/products');
        },
        'error': async (form) => {
            res.render('products/create',{
                'form': form.toHTML(bootstrapField)
            })
        }
    })
})

router.get('/:product_id/update', async (req, res) => {
    // retrieve the product
    const productId = req.params.product_id
    const product = await Product.where({
        'id': productId
    }).fetch({
        require: true,
        withRelated: ['tags']
    });

    const allCategories = await Category.fetchAll().map((category) => {
        return [category.get("id"), category.get('name')]
    })

    const allTags = await Tag.fetchAll().map( tag => {
        return [tag.get('id'), tag.get('name')]
    })

    const productForm = createProductForm(allCategories, allTags);

    // fill in the existing values
    productForm.fields.name.value = product.get('name');
    productForm.fields.cost.value = product.get('cost');
    productForm.fields.description.value = product.get('description');
    productForm.fields.category_id.value = product.get('category_id');
    
    let selectedTags = await product.related('tags').pluck('id')

    productForm.fields.tags.value = selectedTags;

    res.render('products/update', {
        'form': productForm.toHTML(bootstrapField),
        'product': product.toJSON()
    })

})

router.post('/:product_id/update', async (req, res) => {
    // fetch the product that we want to update
    const product = await Product.where({
        'id': req.params.product_id
    }).fetch({
        require: true,
        withRelated: ['tags']
    });

    // process the form
    const productForm = createProductForm();
    productForm.handle(req, {
        'success':async(form) => {
            const {tags, ...productData} = form.data;
            product.set(productData);
            product.save();

            let tagIds = tags.split(',')
            let existingTagIDs = await product.related('tags').pluck('id');

            let toRemove = existingTagIDs.filter( id => tagIds.includes(id) === false);

            await product.tags().detach(toRemove);

            await product.tags().attach(tagIds);

            res.redirect('/products');
        },
        'error':async (form) => {
            res.render('products/update', {
                'form':form.toHTML(bootstrapField),
                'product': product.toJSON()
            })
        }
    })
})

router.get('/:product_id/delete', async(req,res)=>{
    // fetch the product that we want to delete
    const product = await Product.where({
        'id': req.params.product_id
    }).fetch({
        require: true
    });

    res.render('products/delete', {
        'product': product.toJSON()
    })

});

router.post('/:product_id/delete', async(req,res)=>{
    // fetch the product that we want to delete
    const product = await Product.where({
        'id': req.params.product_id
    }).fetch({
        require: true
    });
    await product.destroy();
    res.redirect('/products')
})

module.exports = router;