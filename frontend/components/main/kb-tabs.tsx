import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IKb, IProjKb } from "@/interfaces/kb";
import KBCardList from "./kb-card";
import { useQueryClient } from "@tanstack/react-query";

type KBTabProps = {
  userKbs: IKb[];
  projKbs: IProjKb[];
  setIsProjKb: (isProjKb: boolean) => void;
};


const KBTab = ({ userKbs, projKbs,setIsProjKb }: KBTabProps) => {
  const queryClient = useQueryClient()  
  const projKbsList =  projKbs.flatMap(proj => proj?.kbs?.map(kb => ({
    ...kb,
    is_project_kb: true,
    project_id: proj.id,
    project_name: proj.name,
  })))
  

  return (
    <Tabs defaultValue="user" className="w-full space-y-4">
      <TabsList className="grid w-full grid-cols-2 max-w-[300px] mx-auto bg-muted rounded-lg p-1">
        <TabsTrigger 
          value="user" 
          className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
          onClick={() => setIsProjKb(false)}
        >
          个人知识库
        </TabsTrigger>
        <TabsTrigger 
          value="proj" 
          className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
          onClick={() => setIsProjKb(true)}
        >
          项目知识库
        </TabsTrigger>
      </TabsList>
      <TabsContent value="user" className="mt-4">
        <KBCardList kbs={userKbs} itemsPerPage={3} onSuccess={() => {
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["userKbs"] });
          }, 300);
        }}/>
      </TabsContent>
      <TabsContent value="proj" className="mt-4">
        <KBCardList kbs={projKbsList} itemsPerPage={3} onSuccess={() => {
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ["userProjs"] });
            }, 300);
          }}/>
      </TabsContent>
    </Tabs>
  );
};

export default KBTab;
