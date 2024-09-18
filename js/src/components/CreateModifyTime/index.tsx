import React from 'react'

export const CreateModifyTime = ({
	created,
	modified,
}: {
	created: string
	modified: string
}) => {
	return (
		<>
			<div className="text-xs">建立: {created}</div>
			<div className="text-xs">修改: {modified}</div>
		</>
	)
}
