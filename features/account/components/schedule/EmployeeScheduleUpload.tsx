import AppButton from '@/components/ui/AppButton';
import { api } from '@/services/axios';
import { appDialog } from '@/services/app-dialog';
import * as DocumentPicker from 'expo-document-picker';
import { useEffect,useState } from 'react';
import { Platform,Text,View } from 'react-native';

export default function EmployeeScheduleUpload({locked=false}:{locked?:boolean}) {
  const [file,setFile]=useState<DocumentPicker.DocumentPickerAsset|null>(null);
  const [status,setStatus]=useState('NotSubmitted');const [busy,setBusy]=useState(false);
  const [reason,setReason]=useState('');
  useEffect(()=>{void api.get('/cor-submissions/employee-schedule').then(r=>{setStatus(r.data?.data?.status || 'NotSubmitted');setReason(r.data?.data?.reason || '');}).catch(()=>setStatus('Unable to load status'));},[]);
  async function pick(){const result=await DocumentPicker.getDocumentAsync({type:['application/pdf','image/jpeg','image/png'],copyToCacheDirectory:true});if(!result.canceled)setFile(result.assets[0] || null);}
  async function upload(){
    if(!file || busy || locked)return;
    if(file.size && file.size>5*1024*1024){appDialog.show('File too large','Choose a PDF or image up to 5 MB.');return;}
    setBusy(true);
    try {
      const data=new FormData();
      if(Platform.OS==='web')data.append('file',file.file || await (await fetch(file.uri)).blob(),file.name);
      else data.append('file',{uri:file.uri,name:file.name,type:file.mimeType || 'application/pdf'} as any);
      const response=await api.post('/cor-submissions/employee-schedule',data,{headers:{'Content-Type':'multipart/form-data'}});
      if(!response.data?.isSuccess)throw new Error(response.data?.message || 'Upload failed.');
      setFile(null);setStatus('Pending');setReason('Awaiting administrator review.');appDialog.show('Schedule submitted','An administrator must review your employee schedule. Vehicle approval is separate.');
    }catch(error:any){appDialog.show('Could not submit schedule',error?.response?.data?.message || error?.message || 'Please try again.');}
    finally{setBusy(false);}
  }
  return <View className="my-4 gap-3 rounded-card border border-light-border dark:border-dark-border p-4">
    <Text className="font-semibold text-light-text dark:text-dark-text">Employee schedule</Text>
    <Text className="text-sm text-light-muted dark:text-dark-muted">Status: {status}. Upload your work schedule separately from your employee ID for admin approval.</Text>
    {!!reason && <Text className="text-sm text-light-muted dark:text-dark-muted">{reason}</Text>}
    <AppButton label={file?.name || 'Choose schedule'} variant="outline" uppercase={false} disabled={busy || locked} onPress={()=>void pick()} />
    <AppButton label="Submit schedule" uppercase={false} disabled={!file || busy || locked} onPress={()=>void upload()} />
  </View>;
}
