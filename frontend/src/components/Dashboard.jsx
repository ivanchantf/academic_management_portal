export default function Dashboard({user}) {
    return(
        <>Dashboard -  {user?.Name || 'User'}, Please Select Functions below:</>
    )
}