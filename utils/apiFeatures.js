module.exports = class {
	constructor(query, queryStr, Model) {
		this.query = query;
		this.queryStr = queryStr;
		this.Model = Model;
	}

	filter() {
		const queryObj = { ...this.queryStr };
		const excludedFields = ["page", "sort", "limit", "fields"];
		excludedFields.forEach(el => delete queryObj[el]);

		this.queryString = JSON.stringify(queryObj);
		this.queryString = JSON.parse(
			this.queryString.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)
		);
		this.query.find(this.queryString);
		return this;
	}

	sort() {
		if (this.queryStr.sort) {
			const sortBy = this.queryStr.sort.split(",").join(" ");
			this.query = this.query.sort(sortBy);
		} else {
			this.query = this.query.sort("-createdAt");
		}
		return this;
	}

	limitFields() {
		if (this.queryStr.fields) {
			const fields = this.queryStr.fields.split(",").join(" ");
			this.query = this.query.select(fields);
		} else {
			this.query = this.query.select("-__v");
		}
		return this;
	}

	pagination() {
		const page = +this.queryStr.page || 1;
		const limit = +this.queryStr.limit || 100;
		const skip = (page - 1) * limit;

		this.query = this.query.skip(skip).limit(limit);

		return this;
	}
};
