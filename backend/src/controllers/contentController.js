import Terms from "../models/terms.model.js";

// Public: get current terms content
export const getTerms = async (req, res) => {
    try {
        const terms = await Terms.findOne().sort({ updatedAt: -1 }).lean();
        return res.status(200).json({ success: true, terms: terms?.content || "" });
    } catch (error) {
        console.error("Get terms error:", error);
        return res.status(500).json({ success: false, message: error.message || "Failed to fetch terms" });
    }
};

// Admin: create or update terms
export const updateTerms = async (req, res) => {
    try {
        const { content } = req.body;
        if (typeof content !== "string") {
            return res.status(400).json({ success: false, message: "Content must be a string" });
        }

        let terms = await Terms.findOne();
        if (!terms) {
            terms = new Terms({ content, updatedBy: req.userId });
        } else {
            terms.content = content;
            terms.updatedBy = req.userId;
        }
        await terms.save();

        return res.status(200).json({ success: true, message: "Terms updated successfully", terms: terms.content });
    } catch (error) {
        console.error("Update terms error:", error);
        return res.status(500).json({ success: false, message: error.message || "Failed to update terms" });
    }
};
