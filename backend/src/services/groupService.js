const groupRepo = require('../repositories/groupRepo');
const userRepo = require('../repositories/userRepo');

async function createGroup(userId, name) {
  // Check if user is already in an active group
  const existingGroup = await groupRepo.findUserActiveGroup(userId);
  if (existingGroup) {
    const error = new Error('You are already a member of an active group. You cannot create another group.');
    error.statusCode = 400;
    throw error;
  }

  const group = await groupRepo.createGroup(name, userId);
  const members = await groupRepo.getGroupMembers(group.id);

  return {
    ...group,
    members
  };
}

async function getMyGroup(userId) {
  const group = await groupRepo.findUserActiveGroup(userId);
  if (!group) {
    return null;
  }

  const members = await groupRepo.getGroupMembers(group.id);
  const isOwner = group.owner_id === userId;

  return {
    id: group.id,
    name: group.name,
    ownerId: group.owner_id,
    ownerName: group.owner_name,
    isOwner,
    createdAt: group.created_at,
    members: members.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      studentId: m.student_id,
      joinedAt: m.joined_at,
      isOwner: m.id === group.owner_id
    }))
  };
}

async function searchStudents(queryTerm, currentUserId) {
  if (!queryTerm || queryTerm.trim().length === 0) {
    return [];
  }
  return await userRepo.searchStudents(queryTerm.trim(), currentUserId);
}

async function addMember(groupId, ownerUserId, studentIdentifier) {
  // 1. Verify group exists
  const group = await groupRepo.findById(groupId);
  if (!group) {
    const error = new Error('Group not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. FR-03.5: Only owner may add members
  if (group.owner_id !== ownerUserId) {
    const error = new Error('Forbidden: Only the group owner can add members');
    error.statusCode = 403;
    throw error;
  }

  // 3. Find the target student by email, student ID, or user UUID
  let targetUser = await userRepo.findByEmail(studentIdentifier);
  if (!targetUser) {
    targetUser = await userRepo.findByStudentId(studentIdentifier);
  }
  if (!targetUser) {
    // Check if it's a UUID
    targetUser = await userRepo.findById(studentIdentifier);
  }

  if (!targetUser) {
    const error = new Error('Student not found with provided identifier');
    error.statusCode = 404;
    throw error;
  }

  if (targetUser.role !== 'STUDENT') {
    const error = new Error('Only students can be added to groups');
    error.statusCode = 400;
    throw error;
  }

  // 4. FR-03.3: Check if student is already in ANY active group
  const activeGroup = await groupRepo.findUserActiveGroup(targetUser.id);
  if (activeGroup) {
    if (activeGroup.id === groupId) {
      const error = new Error('Student is already a member of this group');
      error.statusCode = 400;
      throw error;
    } else {
      const error = new Error(`Student is already a member of another active group ("${activeGroup.name}")`);
      error.statusCode = 400;
      throw error;
    }
  }

  // 5. Add to group
  await groupRepo.addMember(groupId, targetUser.id);
  const updatedMembers = await groupRepo.getGroupMembers(groupId);

  return {
    message: 'Member added successfully',
    group: {
      ...group,
      members: updatedMembers
    }
  };
}

async function removeMember(groupId, ownerUserId, targetUserId) {
  // 1. Verify group exists
  const group = await groupRepo.findById(groupId);
  if (!group) {
    const error = new Error('Group not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. FR-03.5: Only owner may remove members
  if (group.owner_id !== ownerUserId) {
    const error = new Error('Forbidden: Only the group owner can remove members');
    error.statusCode = 403;
    throw error;
  }

  // 3. Owner cannot remove themselves (must transfer ownership or delete group, which is out of MVP scope)
  if (ownerUserId === targetUserId) {
    const error = new Error('Group owner cannot be removed from the group');
    error.statusCode = 400;
    throw error;
  }

  // 4. Verify user is in this group
  const isMember = await groupRepo.isMember(groupId, targetUserId);
  if (!isMember) {
    const error = new Error('User is not a member of this group');
    error.statusCode = 404;
    throw error;
  }

  await groupRepo.removeMember(groupId, targetUserId);
  const updatedMembers = await groupRepo.getGroupMembers(groupId);

  return {
    message: 'Member removed successfully',
    members: updatedMembers
  };
}

module.exports = {
  createGroup,
  getMyGroup,
  searchStudents,
  addMember,
  removeMember
};
