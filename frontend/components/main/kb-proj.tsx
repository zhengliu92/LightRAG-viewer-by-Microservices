

import React from 'react'
import { IProjKb } from '@/interfaces/kb'

type KBProjProps = {
    projKbs: IProjKb[]
}

const KBProj = ({ projKbs }: KBProjProps) => {
  return (
    <div>
      <div className="grid gap-4 grid-cols-3 my-4 max-md:grid-cols-2">
        {
            projKbs.map((proj) => (
                <div key={proj.id}>
                    {proj.name}
                </div>
            ))
        }
      </div>
    </div>
  )
}

export default KBProj