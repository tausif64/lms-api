import * as LectureService from "../../services/instructor/lecture.service.js";

export const createLecture = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { sectionId } = req.params;
    const { title } = req.body;
    const newLecture = await LectureService.createLectureForSection(
      ownerId,
      sectionId,
      title
    );
    res.status(201).json(newLecture);
  } catch (error) {
    if (error.message === "FORBIDDEN")
      return res.status(403).json({ message: "Forbidden" });
    next(error);
  }
};

export const getLecturesBySection = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { sectionId } = req.params;
    const lectures = await LectureService.findLecturesBySection(
      ownerId,
      sectionId
    );
    res.status(200).json(lectures);
  } catch (error) {
    if (error.message === "FORBIDDEN")
      return res.status(403).json({ message: "Forbidden" });
    next(error);
  }
};

export const getDeletedLectures = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { sectionId } = req.params;
    const lectures = await LectureService.findDeletedLecturesBySection(
      ownerId,
      sectionId
    );
    res.status(200).json(lectures);
  } catch (error) {
    if (error.message === "FORBIDDEN")
      return res.status(403).json({ message: "Forbidden" });
    next(error);
  }
};

export const updateLecture = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { lectureId } = req.params;
    const updateData = req.body;
    const updatedLecture = await LectureService.updateLectureById(
      ownerId,
      lectureId,
      updateData
    );
    res.status(200).json(updatedLecture);
  } catch (error) {
    if (error.message === "FORBIDDEN")
      return res.status(403).json({ message: "Forbidden" });
    next(error);
  }
};

export const deleteLecture = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { lectureId } = req.params;
    await LectureService.softDeleteLectureById(ownerId, lectureId);
    res.status(204).send();
  } catch (error) {
    if (error.message === "FORBIDDEN")
      return res.status(403).json({ message: "Forbidden" });
    next(error);
  }
};

export const restoreLecture = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { lectureId } = req.params;
    const restoredLecture = await LectureService.restoreLectureById(
      ownerId,
      lectureId
    );
    res.status(200).json(restoredLecture);
  } catch (error) {
    if (error.message === "FORBIDDEN" || error.message === "NOT_RESTORABLE") {
      return res.status(403).json({ message: error.message });
    }
    next(error);
  }
};

export const uploadLectureVideo = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { lectureId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No video file uploaded." });
    }

    const updatedLecture = await LectureService.handleLectureVideoUpload(
      ownerId,
      lectureId,
      req.file
    );
    res
      .status(202)
      .json({
        message: "Video upload accepted and is now processing.",
        lecture: updatedLecture,
      });
  } catch (error) {
    if (error.message === "FORBIDDEN")
      return res.status(403).json({ message: "Forbidden" });
    next(error);
  }
};
