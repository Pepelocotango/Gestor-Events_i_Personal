export const validateData = (data) => {
    const errors = [];
    const eventFrameIds = new Set(data.eventFrames.map(ef => ef.id));
    const personGroupIds = new Set(data.peopleGroups.map(pg => pg.id));
    (data.assignments || []).forEach(assignment => {
        if (!eventFrameIds.has(assignment.eventFrameId)) {
            errors.push({
                type: 'broken_assignment_reference',
                message: `L'assignació '${assignment.id}' fa referència a un esdeveniment que no existeix (${assignment.eventFrameId}).`,
                assignmentId: assignment.id,
                eventFrameId: assignment.eventFrameId,
                personGroupId: assignment.personGroupId,
            });
        }
        if (!personGroupIds.has(assignment.personGroupId)) {
            errors.push({
                type: 'broken_assignment_reference',
                message: `L'assignació '${assignment.id}' fa referència a una persona/grup que no existeix (${assignment.personGroupId}).`,
                assignmentId: assignment.id,
                eventFrameId: assignment.eventFrameId,
                personGroupId: assignment.personGroupId,
            });
        }
    });
    return {
        isValid: errors.length === 0,
        errors,
    };
};
export const repairData = (data, errors) => {
    const repairedData = { ...data };
    const fixes = [];
    const assignmentsToRemove = new Set();
    errors.forEach(error => {
        if (error.type === 'broken_assignment_reference') {
            if (!assignmentsToRemove.has(error.assignmentId)) {
                assignmentsToRemove.add(error.assignmentId);
                fixes.push(`S'ha eliminat una assignació trencada (ID: ${error.assignmentId}).`);
            }
        }
    });
    if (assignmentsToRemove.size > 0) {
        repairedData.assignments = (repairedData.assignments || []).filter(assignment => !assignmentsToRemove.has(assignment.id));
    }
    return {
        repairedData,
        fixes,
    };
};
//# sourceMappingURL=dataIntegrity.js.map