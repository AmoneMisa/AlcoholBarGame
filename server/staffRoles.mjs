export const OWNER_TELEGRAM_ID = '86416302';
const denied = () => ({status:403,body:{ok:false,error:'You do not have permission for this operation.'}});
export function createStaffRoles({repository,now,ownerTelegramIds=[]}) {
  const owners=new Set([OWNER_TELEGRAM_ID,...ownerTelegramIds.map(String)]);
  const roleIn = async (tx,identity) => identity?.kind !== 'telegram' ? null : owners.has(String(identity.telegramId)) ? 'owner' : await tx.staffRole(identity.telegramId);
  const staffRole = identity => repository.transaction(tx=>roleIn(tx,identity));
  async function staffList(identity) {
    return repository.transaction(async tx=> {
      const role=await roleIn(tx,identity);
      if(!['owner','admin'].includes(role)) return denied();
      return {ok:true,staff:[...[...owners].map(telegramId=>({telegramId,role:'owner'})),...(await tx.listStaff()).filter(row=>!owners.has(String(row.telegramId)))]};
    });
  }
  async function staffSetRole(identity,body) {
    if(!/^[1-9]\d{0,15}$/.test(String(body?.telegramId ?? '')) || !['moderator','admin','none'].includes(body?.role)) return {status:400,body:{ok:false,error:'Choose a Telegram ID and a valid role.'}};
    if(typeof body.reason!=='string' || body.reason.trim().length<3 || body.reason.length>500) return {status:400,body:{ok:false,error:'Provide a reason (3–500 characters).'}};
    return repository.transaction(async tx=> {
      await tx.lockStaffRoles();
      const role=await roleIn(tx,identity), target=String(body.telegramId);
      const previous=owners.has(target) ? 'owner' : await tx.staffRole(target);
      if(!['owner','admin'].includes(role) || owners.has(target) || target===String(identity.telegramId)) return denied();
      // Administrators may only assign/revoke moderators, never promote themselves or alter administrators.
      if(role==='admin' && (body.role==='admin' || previous==='admin')) return denied();
      await tx.setStaffRole(target,body.role,identity.telegramId);
      await tx.addEvent(identity,'admin.staff.role',{targetTelegramId:target,previous:previous ?? 'none',role:body.role,reason:body.reason.trim()},now());
      return {ok:true};
    });
  }
  return {staffRole,staffList,staffSetRole,roleIn};
}
