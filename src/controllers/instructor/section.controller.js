import * as SectionService from "../../services/instructor/section.service.js";

// --- PREVIOUSLY CREATED FUNCTIONS (NO CHANGES NEEDED) ---
export const createSection = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { courseId } = req.params;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Section title is required." });
    }

    const newSection = await SectionService.createSectionForCourse(
      ownerId,
      courseId,
      title
    );
    res.status(201).json(newSection);
  } catch (error) {
    if (error.message === "FORBIDDEN") {
      return res
        .status(403)
        .json({
          message: "You are not authorized to add a section to this course.",
        });
    }
    next(error);
  }
};
export const getSectionsByCourse = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { courseId } = req.params;
    const sections = await SectionService.findSectionsByCourse(
      ownerId,
      courseId
    );
    res.status(200).json(sections);
  } catch (error) {
    if (error.message === "FORBIDDEN") {
      return res
        .status(403)
        .json({ message: "You are not authorized to view these sections." });
    }
    next(error);
  }
};
export const updateSection = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { sectionId } = req.params;
    const updateData = req.body; // e.g., { title, orderIndex }

    const updatedSection = await SectionService.updateSectionById(
      ownerId,
      sectionId,
      updateData
    );
    res.status(200).json(updatedSection);
  } catch (error) {
    if (error.message === "FORBIDDEN") {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this section." });
    }
    next(error);
  }
};
export const deleteSection = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { sectionId } = req.params;
    await SectionService.softDeleteSectionById(ownerId, sectionId);
    res.status(204).send();
  } catch (error) {
    if (error.message === "FORBIDDEN") {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this section." });
    }
    next(error);
  }
};


export const restoreSection = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { sectionId } = req.params;
    const restoredSection = await SectionService.restoreSectionById(
      ownerId,
      sectionId
    );
    res.status(200).json(restoredSection);
  } catch (error) {
    if (error.message === "FORBIDDEN" || error.message === "NOT_RESTORABLE") {
      return res.status(403).json({ message: error.message });
    }
    next(error);
  }
};

export const getDeletedSections = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { courseId } = req.params;
    const sections = await SectionService.findDeletedSectionsByCourse(
      ownerId,
      courseId
    );
    res.status(200).json(sections);
  } catch (error) {
    if (error.message === "FORBIDDEN") {
      return res
        .status(403)
        .json({ message: "You are not authorized to view these sections." });
    }
    next(error);
  }
};