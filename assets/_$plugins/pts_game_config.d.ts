
interface _IData {
   version: string;
   prefix_key: string;
   platform: string;
}

declare namespace pTS {
	export namespace game {
		export const config: _IData;
	}
}

declare namespace pTS {
    export namespace bridge {
        export type _TData_Definded_By_Extensions = {
            config: _IData
        }
    }
}
